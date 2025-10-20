import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Mock data
const mockRepositories = [
  {
    id: "1",
    name: "auth-service",
    url: "https://github.com/company/auth-service",
    vulnerabilities: 8,
    lastScanned: "2 hours ago",
    status: "active",
    securityScore: 85
  },
  {
    id: "2", 
    name: "web-app",
    url: "https://github.com/company/web-app",
    vulnerabilities: 15,
    lastScanned: "1 hour ago",
    status: "active",
    securityScore: 72
  },
  {
    id: "3",
    name: "api-gateway", 
    url: "https://github.com/company/api-gateway",
    vulnerabilities: 3,
    lastScanned: "30 minutes ago",
    status: "active",
    securityScore: 94
  }
];

const mockVulnerabilities = [
  {
    id: "1",
    title: "SQL Injection in login endpoint",
    description: "Potential SQL injection vulnerability detected in user authentication",
    severity: "critical",
    type: "SQL Injection",
    file: "src/auth/login.js",
    line: 45,
    status: "open",
    repositoryId: "1",
    detectedAt: "2024-10-20T10:00:00Z"
  },
  {
    id: "2",
    title: "XSS vulnerability in search",
    description: "Cross-site scripting vulnerability in search functionality",
    severity: "high", 
    type: "XSS",
    file: "src/components/search.jsx",
    line: 123,
    status: "in_progress",
    repositoryId: "2",
    detectedAt: "2024-10-20T09:00:00Z"
  }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      database: 'connected',
      redis: 'connected'
    }
  });
});

// Helper function to generate detailed vulnerabilities
const generateDetailedVulnerabilities = (repositoryId, count) => {
  const vulnerabilityTemplates = [
    {
      title: "SQL Injection Vulnerability",
      description: "Potential SQL injection detected in database query construction",
      severity: "critical",
      type: "sql-injection",
      file: "src/auth/login.js",
      line: Math.floor(Math.random() * 100) + 1,
      solution: "Use parameterized queries or prepared statements"
    },
    {
      title: "Cross-Site Scripting (XSS)",
      description: "User input not properly sanitized before rendering",
      severity: "high", 
      type: "xss",
      file: "src/components/UserProfile.jsx",
      line: Math.floor(Math.random() * 50) + 1,
      solution: "Implement proper input validation and output encoding"
    },
    {
      title: "Insecure Dependency",
      description: "Using outdated package with known vulnerabilities",
      severity: "medium",
      type: "dependency",
      file: "package.json",
      line: Math.floor(Math.random() * 20) + 1,
      solution: "Update to latest secure version"
    },
    {
      title: "Hardcoded Secret",
      description: "API key or password found in source code",
      severity: "high",
      type: "secrets",
      file: "src/config/database.js",
      line: Math.floor(Math.random() * 30) + 1,
      solution: "Move secrets to environment variables"
    },
    {
      title: "Weak Authentication",
      description: "Insufficient password complexity requirements",
      severity: "medium",
      type: "auth",
      file: "src/middleware/auth.js",
      line: Math.floor(Math.random() * 40) + 1,
      solution: "Implement stronger password policies"
    },
    {
      title: "Information Disclosure",
      description: "Sensitive information exposed in error messages",
      severity: "low",
      type: "info-disclosure",
      file: "src/utils/errorHandler.js",
      line: Math.floor(Math.random() * 25) + 1,
      solution: "Sanitize error messages for production"
    }
  ];

  for (let i = 0; i < count; i++) {
    const template = vulnerabilityTemplates[Math.floor(Math.random() * vulnerabilityTemplates.length)];
    const vulnerability = {
      id: String(mockVulnerabilities.length + 1),
      repositoryId,
      title: template.title,
      description: template.description,
      severity: template.severity,
      type: template.type,
      file: template.file,
      line: template.line,
      solution: template.solution,
      status: 'open',
      discoveredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    mockVulnerabilities.push(vulnerability);
  }
};

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'CodeGuardian AI Backend is running! 🚀',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    config: {
      port: port,
      database: 'connected',
      aws: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'missing',
      github: process.env.GITHUB_CLIENT_ID ? 'configured' : 'missing'
    }
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication
  if (email && password) {
    res.json({
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: '1',
        name: 'Demo User',
        email: email,
        avatar: '/placeholder-user.jpg'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  res.json({
    success: true,
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: '1',
      name: name,
      email: email,
      avatar: '/placeholder-user.jpg'
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    user: {
      id: '1',
      name: 'Demo User',
      email: 'demo@codeguardian.ai',
      avatar: '/placeholder-user.jpg'
    }
  });
});

// Repository endpoints
app.get('/api/repositories', (req, res) => {
  res.json({
    success: true,
    repositories: mockRepositories
  });
});

app.get('/api/repositories/:id', (req, res) => {
  const repo = mockRepositories.find(r => r.id === req.params.id);
  if (repo) {
    res.json({
      success: true,
      repository: repo
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Repository not found'
    });
  }
});

// Get vulnerabilities for a specific repository
app.get('/api/repositories/:id/vulnerabilities', (req, res) => {
  const repo = mockRepositories.find(r => r.id === req.params.id);
  if (!repo) {
    return res.status(404).json({
      success: false,
      error: 'Repository not found'
    });
  }

  const repoVulnerabilities = mockVulnerabilities.filter(v => v.repositoryId === req.params.id);
  
  res.json({
    success: true,
    repository: repo,
    vulnerabilities: repoVulnerabilities,
    summary: {
      total: repoVulnerabilities.length,
      critical: repoVulnerabilities.filter(v => v.severity === 'critical').length,
      high: repoVulnerabilities.filter(v => v.severity === 'high').length,
      medium: repoVulnerabilities.filter(v => v.severity === 'medium').length,
      low: repoVulnerabilities.filter(v => v.severity === 'low').length,
    }
  });
});

app.post('/api/repositories', (req, res) => {
  const { name, url } = req.body;
  
  // Validate input
  if (!name || !url) {
    return res.status(400).json({
      success: false,
      error: 'Repository name and URL are required'
    });
  }
  
  // Generate realistic vulnerability data based on repository type
  const generateVulnerabilities = (repoName, repoUrl) => {
    const vulnTypes = [
      { type: 'SQL Injection', severity: 'critical', count: Math.floor(Math.random() * 3) },
      { type: 'Cross-Site Scripting (XSS)', severity: 'high', count: Math.floor(Math.random() * 5) },
      { type: 'Insecure Dependencies', severity: 'medium', count: Math.floor(Math.random() * 8) },
      { type: 'Hardcoded Secrets', severity: 'high', count: Math.floor(Math.random() * 2) },
      { type: 'Weak Authentication', severity: 'medium', count: Math.floor(Math.random() * 3) },
      { type: 'Information Disclosure', severity: 'low', count: Math.floor(Math.random() * 4) }
    ];
    
    return vulnTypes.reduce((total, vuln) => total + vuln.count, 0);
  };
  
  // Simulate repository scanning process
  const vulnerabilityCount = generateVulnerabilities(name, url);
  const securityScore = Math.max(10, 100 - (vulnerabilityCount * 3) - Math.floor(Math.random() * 15));
  
  const newRepo = {
    id: String(mockRepositories.length + 1),
    name,
    url,
    vulnerabilities: vulnerabilityCount,
    lastScanned: 'Scanning in progress...',
    status: 'scanning',
    securityScore: 0, // Will be set after scan completes
    scanProgress: 0
  };
  
  mockRepositories.push(newRepo);
  
  // Send immediate response
  res.json({
    success: true,
    repository: newRepo,
    message: `Repository "${name}" connected successfully! Security scan in progress...`,
    scanning: true,
    estimatedTime: '30-60 seconds'
  });
  
  // Simulate progressive scanning updates
  let progress = 0;
  const scanInterval = setInterval(() => {
    const repo = mockRepositories.find(r => r.id === newRepo.id);
    if (repo) {
      progress += Math.floor(Math.random() * 20) + 10;
      repo.scanProgress = Math.min(progress, 95);
      repo.lastScanned = `Scanning... ${repo.scanProgress}%`;
      
      if (progress >= 95) {
        clearInterval(scanInterval);
        
        // Complete the scan
        setTimeout(() => {
          repo.status = 'active';
          repo.securityScore = securityScore;
          repo.lastScanned = new Date().toLocaleString();
          repo.scanProgress = 100;
          
          console.log(`✅ Scan completed for repository: ${name}`);
          console.log(`   Vulnerabilities found: ${vulnerabilityCount}`);
          console.log(`   Security Score: ${securityScore}/100`);
          
          // Generate detailed vulnerabilities for this repository
          generateDetailedVulnerabilities(newRepo.id, vulnerabilityCount);
        }, 1000);
      }
    }
  }, 1500); // Update every 1.5 seconds
});

// Vulnerability endpoints
app.get('/api/vulnerabilities', (req, res) => {
  let filteredVulns = [...mockVulnerabilities];
  
  if (req.query.severity) {
    filteredVulns = filteredVulns.filter(v => v.severity === req.query.severity);
  }
  
  if (req.query.status) {
    filteredVulns = filteredVulns.filter(v => v.status === req.query.status);
  }
  
  if (req.query.repositoryId) {
    filteredVulns = filteredVulns.filter(v => v.repositoryId === req.query.repositoryId);
  }
  
  res.json({
    success: true,
    vulnerabilities: filteredVulns
  });
});

app.get('/api/vulnerabilities/:id', (req, res) => {
  const vuln = mockVulnerabilities.find(v => v.id === req.params.id);
  if (vuln) {
    res.json({
      success: true,
      vulnerability: vuln
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Vulnerability not found'
    });
  }
});

// Dashboard endpoints
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    totalRepositories: mockRepositories.length,
    totalVulnerabilities: mockVulnerabilities.length,
    criticalIssues: mockVulnerabilities.filter(v => v.severity === 'critical').length,
    resolvedIssues: mockVulnerabilities.filter(v => v.status === 'fixed').length,
    weeklyTrends: {
      vulnerabilities: [12, 8, 15, 10, 5, 7, 3],
      fixes: [5, 8, 12, 6, 9, 11, 8]
    }
  });
});

app.get('/api/dashboard/activity', (req, res) => {
  res.json({
    success: true,
    activities: [
      {
        type: 'fixed',
        title: 'SQL Injection Fixed',
        time: '2 hours ago',
        repositoryName: 'auth-service'
      },
      {
        type: 'detected',
        title: 'XSS Vulnerability Detected',
        time: '5 hours ago',
        repositoryName: 'web-app'
      },
      {
        type: 'scanned',
        title: 'Repository Scanned',
        time: '1 day ago',
        repositoryName: 'api-gateway'
      }
    ]
  });
});

const server = app.listen(port, () => {
  console.log(`🚀 CodeGuardian AI Backend running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
  console.log(`📁 Repositories: http://localhost:${port}/api/repositories`);
  console.log(`🔍 Vulnerabilities: http://localhost:${port}/api/vulnerabilities`);
  console.log(`📈 Dashboard: http://localhost:${port}/api/dashboard/stats`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});