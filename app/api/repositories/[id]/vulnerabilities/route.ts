import { NextRequest, NextResponse } from 'next/server';

// Mock vulnerabilities data generator
const generateVulnerabilities = (repoId: string) => [
  {
    id: `vuln-${repoId}-1`,
    title: 'SQL Injection Vulnerability',
    description: 'Potential SQL injection vulnerability found in user input handling',
    severity: 'critical',
    type: 'injection',
    file: 'src/database/queries.js',
    line: 42,
    status: 'open',
    repositoryId: repoId,
    detectedAt: '2024-01-15T09:15:00Z'
  },
  {
    id: `vuln-${repoId}-2`,
    title: 'XSS Vulnerability',
    description: 'Cross-site scripting vulnerability in user profile page',
    severity: 'high',
    type: 'xss',
    file: 'src/components/Profile.tsx',
    line: 128,
    status: 'in_progress',
    repositoryId: repoId,
    detectedAt: '2024-01-14T16:30:00Z'
  },
  {
    id: `vuln-${repoId}-3`,
    title: 'Insecure Dependencies',
    description: 'Outdated npm packages with known vulnerabilities',
    severity: 'medium',
    type: 'dependency',
    file: 'package.json',
    line: 1,
    status: 'open',
    repositoryId: repoId,
    detectedAt: '2024-01-13T11:45:00Z'
  },
  {
    id: `vuln-${repoId}-4`,
    title: 'Weak Authentication',
    description: 'JWT tokens have insufficient expiration time',
    severity: 'medium',
    type: 'authentication',
    file: 'src/auth/jwt.js',
    line: 25,
    status: 'fixed',
    repositoryId: repoId,
    detectedAt: '2024-01-12T14:20:00Z',
    fixedAt: '2024-01-14T10:30:00Z'
  },
  {
    id: `vuln-${repoId}-5`,
    title: 'Information Disclosure',
    description: 'Sensitive information exposed in error messages',
    severity: 'low',
    type: 'information_disclosure',
    file: 'src/utils/error-handler.js',
    line: 67,
    status: 'dismissed',
    repositoryId: repoId,
    detectedAt: '2024-01-11T08:30:00Z'
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const repoId = params.id;
  const vulnerabilities = generateVulnerabilities(repoId);
  
  return NextResponse.json({ vulnerabilities });
}