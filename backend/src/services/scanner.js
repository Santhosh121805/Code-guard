import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { prisma } from '../lib/prisma.js';
import { redis } from './redis.js';
import { websocket } from './websocket.js';
import { github } from './github.js';
import { logger } from '../utils/logger.js';

export class ScannerService {
  constructor() {
    this.bedrock = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    this.modelId = 'anthropic.claude-3-sonnet-20240229-v1:0';
    this.maxConcurrentScans = 3;
    this.activeScanSemaphore = 0;
  }

  async triggerScan(repositoryId, userId) {
    try {
      // Check semaphore to prevent too many concurrent scans
      if (this.activeScanSemaphore >= this.maxConcurrentScans) {
        throw new Error('Maximum number of concurrent scans reached. Please try again later.');
      }

      const repository = await prisma.repository.findUnique({
        where: { id: repositoryId },
        include: { user: true }
      });

      if (!repository) {
        throw new Error('Repository not found');
      }

      if (repository.userId !== userId) {
        throw new Error('Unauthorized access to repository');
      }

      // Create scan record
      const scan = await prisma.scan.create({
        data: {
          repositoryId,
          userId,
          status: 'IN_PROGRESS',
          scanType: 'FULL',
          triggeredBy: 'MANUAL'
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          type: 'SCAN_STARTED',
          description: `Security scan started for ${repository.name}`,
          userId,
          repositoryId
        }
      });

      // Broadcast scan started
      websocket.broadcast(`user:${userId}`, 'scan:started', {
        scanId: scan.id,
        repositoryId,
        status: 'IN_PROGRESS'
      });

      // Start scan process asynchronously
      this.performScan(scan.id, repository, repository.user).catch(error => {
        logger.error('Scan failed:', error);
        this.handleScanError(scan.id, error, userId, repositoryId);
      });

      return scan;
    } catch (error) {
      logger.error('Failed to trigger scan:', error);
      throw error;
    }
  }

  async performScan(scanId, repository, user) {
    this.activeScanSemaphore++;
    
    try {
      // Update scan status
      await prisma.scan.update({
        where: { id: scanId },
        data: { 
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });

      // Extract repository info
      const [owner, repoName] = repository.fullName.split('/');
      
      // Get repository files from GitHub
      const files = await github.getRepositoryFiles(owner, repoName, repository.branch, user.githubToken);
      
      if (!files || files.length === 0) {
        throw new Error('No scannable files found in repository');
      }

      logger.info(`Scanning ${files.length} files for repository ${repository.name}`);

      // Filter files for security scanning (code files only)
      const scannableFiles = files.filter(file => 
        this.isScannable(file.name) && file.size < 1024 * 1024 // Max 1MB per file
      );

      const vulnerabilities = [];
      let scannedFiles = 0;
      const totalFiles = scannableFiles.length;

      // Process files in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < scannableFiles.length; i += batchSize) {
        const batch = scannableFiles.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (file) => {
          try {
            // Get file content
            const content = await github.getFileContent(owner, repoName, file.path, repository.branch, user.githubToken);
            
            if (!content || content.length > 50000) { // Skip very large files
              return [];
            }

            // Analyze file with Claude
            const fileVulns = await this.analyzeFileWithAI(file, content, repository);
            scannedFiles++;

            // Update progress
            const progress = Math.round((scannedFiles / totalFiles) * 100);
            websocket.broadcast(`user:${user.id}`, 'scan:progress', {
              scanId,
              progress,
              currentFile: file.name,
              scannedFiles,
              totalFiles
            });

            return fileVulns;
          } catch (error) {
            logger.warn(`Failed to scan file ${file.path}:`, error);
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        vulnerabilities.push(...batchResults.flat());

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Save vulnerabilities to database
      if (vulnerabilities.length > 0) {
        await prisma.vulnerability.createMany({
          data: vulnerabilities.map(vuln => ({
            ...vuln,
            repositoryId: repository.id,
            scanId,
            discoveredAt: new Date()
          }))
        });
      }

      // Calculate security score
      const securityScore = this.calculateSecurityScore(vulnerabilities);

      // Complete scan
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          vulnerabilitiesFound: vulnerabilities.length,
          securityScore,
          summary: this.generateScanSummary(vulnerabilities)
        }
      });

      // Update repository security score
      await prisma.repository.update({
        where: { id: repository.id },
        data: { 
          securityScore,
          lastScanAt: new Date()
        }
      });

      // Log completion activity
      await prisma.activity.create({
        data: {
          type: 'SCAN_COMPLETED',
          description: `Security scan completed for ${repository.name}. Found ${vulnerabilities.length} vulnerabilities.`,
          userId: user.id,
          repositoryId: repository.id
        }
      });

      // Clear cache
      await redis.del(`repo:${repository.id}:stats`);

      // Broadcast scan completion
      websocket.broadcast(`user:${user.id}`, 'scan:completed', {
        scanId,
        repositoryId: repository.id,
        vulnerabilitiesFound: vulnerabilities.length,
        securityScore,
        criticalVulnerabilities: vulnerabilities.filter(v => v.severity === 'CRITICAL').length
      });

      // Send email notification for critical vulnerabilities
      if (vulnerabilities.some(v => v.severity === 'CRITICAL')) {
        const { EmailService } = await import('./email.js');
        const emailService = new EmailService();
        
        const criticalVulns = vulnerabilities.filter(v => v.severity === 'CRITICAL');
        for (const vuln of criticalVulns.slice(0, 3)) { // Limit to first 3
          await emailService.sendVulnerabilityAlert(user.email, user.name, vuln, repository);
        }
      }

      logger.info(`Scan completed for ${repository.name}: ${vulnerabilities.length} vulnerabilities found`);

    } catch (error) {
      logger.error('Scan processing failed:', error);
      throw error;
    } finally {
      this.activeScanSemaphore--;
    }
  }

  async analyzeFileWithAI(file, content, repository) {
    try {
      const prompt = this.buildSecurityPrompt(file, content, repository);
      
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 4000,
          temperature: 0.1,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
        contentType: 'application/json',
      });

      const response = await this.bedrock.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      const analysisResult = responseBody.content[0].text;
      
      // Parse AI response to extract vulnerabilities
      return this.parseAIResponse(analysisResult, file, content);
      
    } catch (error) {
      logger.error('AI analysis failed:', error);
      return [];
    }
  }

  buildSecurityPrompt(file, content, repository) {
    return `You are a security expert analyzing code for vulnerabilities. Analyze the following ${file.name} file from a ${repository.language || 'unknown'} project and identify security vulnerabilities.

File: ${file.name}
Path: ${file.path}
Language: ${this.detectLanguage(file.name)}

Code Content:
\`\`\`
${content.substring(0, 8000)} ${content.length > 8000 ? '... (truncated)' : ''}
\`\`\`

Please analyze this code and identify security vulnerabilities. For each vulnerability found, provide:

1. **Type**: The category of vulnerability (e.g., SQL Injection, XSS, CSRF, etc.)
2. **Severity**: CRITICAL, HIGH, MEDIUM, or LOW
3. **Line Number**: The approximate line where the issue occurs
4. **Title**: A brief descriptive title
5. **Description**: Detailed explanation of the vulnerability
6. **Impact**: Potential security impact
7. **Recommendation**: How to fix the vulnerability

Focus on:
- Input validation issues
- Authentication/Authorization flaws  
- Injection vulnerabilities (SQL, Command, etc.)
- Cross-site scripting (XSS)
- Insecure direct object references
- Security misconfigurations
- Cryptographic issues
- Business logic flaws
- Dependencies with known vulnerabilities

Format your response as a JSON array of vulnerability objects:

\`\`\`json
[
  {
    "type": "SQL_INJECTION",
    "severity": "HIGH",
    "lineNumber": 42,
    "title": "SQL Injection in user query",
    "description": "User input is directly concatenated into SQL query without sanitization",
    "impact": "Attackers could execute arbitrary SQL commands and access sensitive data",
    "recommendation": "Use parameterized queries or prepared statements"
  }
]
\`\`\`

If no vulnerabilities are found, return an empty array: []`;
  }

  parseAIResponse(aiResponse, file, content) {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        // Try to find JSON without markdown formatting
        const bracketMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (!bracketMatch) {
          return [];
        }
        return JSON.parse(bracketMatch[0]);
      }

      const vulnerabilities = JSON.parse(jsonMatch[1]);
      
      // Validate and enhance vulnerability data
      return vulnerabilities.map(vuln => ({
        type: vuln.type || 'UNKNOWN',
        severity: this.normalizeSeverity(vuln.severity),
        title: vuln.title || 'Security Issue',
        description: vuln.description || 'No description provided',
        impact: vuln.impact || 'Potential security risk',
        recommendation: vuln.recommendation || 'Review code for security best practices',
        filePath: file.path,
        fileName: file.name,
        lineNumber: parseInt(vuln.lineNumber) || 1,
        codeSnippet: this.extractCodeSnippet(content, parseInt(vuln.lineNumber) || 1),
        confidence: vuln.confidence || 'MEDIUM'
      }));
    } catch (error) {
      logger.warn('Failed to parse AI response:', error);
      return [];
    }
  }

  normalizeSeverity(severity) {
    const severityMap = {
      'CRITICAL': 'CRITICAL',
      'HIGH': 'HIGH', 
      'MEDIUM': 'MEDIUM',
      'LOW': 'LOW',
      'SEVERE': 'CRITICAL',
      'MAJOR': 'HIGH',
      'MINOR': 'LOW',
      'INFO': 'LOW'
    };
    
    return severityMap[severity?.toUpperCase()] || 'MEDIUM';
  }

  extractCodeSnippet(content, lineNumber) {
    const lines = content.split('\n');
    const start = Math.max(0, lineNumber - 3);
    const end = Math.min(lines.length, lineNumber + 2);
    
    return lines.slice(start, end).map((line, index) => 
      `${start + index + 1}: ${line}`
    ).join('\n');
  }

  calculateSecurityScore(vulnerabilities) {
    let score = 100;
    
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'CRITICAL':
          score -= 25;
          break;
        case 'HIGH':
          score -= 10;
          break;
        case 'MEDIUM':
          score -= 5;
          break;
        case 'LOW':
          score -= 2;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  generateScanSummary(vulnerabilities) {
    const severityCount = {
      CRITICAL: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      HIGH: vulnerabilities.filter(v => v.severity === 'HIGH').length,
      MEDIUM: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      LOW: vulnerabilities.filter(v => v.severity === 'LOW').length
    };

    const topTypes = vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.type] = (acc[vuln.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: vulnerabilities.length,
      severityDistribution: severityCount,
      topVulnerabilityTypes: Object.entries(topTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }))
    };
  }

  async handleScanError(scanId, error, userId, repositoryId) {
    try {
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message
        }
      });

      await prisma.activity.create({
        data: {
          type: 'SCAN_FAILED',
          description: `Security scan failed: ${error.message}`,
          userId,
          repositoryId
        }
      });

      websocket.broadcast(`user:${userId}`, 'scan:failed', {
        scanId,
        repositoryId,
        error: error.message
      });
    } catch (dbError) {
      logger.error('Failed to handle scan error:', dbError);
    }
  }

  isScannable(filename) {
    const scannableExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
      '.py', '.rb', '.php', '.java', '.cs', '.cpp', '.c', '.cc',
      '.go', '.rs', '.swift', '.kt', '.scala', '.clj',
      '.sql', '.html', '.htm', '.xml', '.json', '.yaml', '.yml',
      '.sh', '.bash', '.ps1', '.dockerfile'
    ];

    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return scannableExtensions.includes(ext) || filename.toLowerCase() === 'dockerfile';
  }

  detectLanguage(filename) {
    const languageMap = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript (React)',
      '.ts': 'TypeScript', 
      '.tsx': 'TypeScript (React)',
      '.py': 'Python',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.java': 'Java',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.go': 'Go',
      '.rs': 'Rust',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.sql': 'SQL',
      '.html': 'HTML',
      '.xml': 'XML',
      '.sh': 'Shell',
      '.bash': 'Bash',
      '.ps1': 'PowerShell'
    };

    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return languageMap[ext] || 'Unknown';
  }
}

// Export singleton instance and trigger function
export const scanner = new ScannerService();
export const triggerScan = (repositoryId, userId) => scanner.triggerScan(repositoryId, userId);