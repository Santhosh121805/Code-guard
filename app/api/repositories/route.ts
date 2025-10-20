import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration
let repositories = [
  {
    id: 'repo-1',
    name: 'code-guardian-frontend',
    url: 'https://github.com/user/code-guardian-frontend',
    vulnerabilities: 12,
    lastScanned: '2024-01-15T10:30:00Z',
    status: 'active',
    securityScore: 85
  },
  {
    id: 'repo-2', 
    name: 'api-service',
    url: 'https://github.com/user/api-service',
    vulnerabilities: 7,
    lastScanned: '2024-01-14T14:20:00Z',
    status: 'active',
    securityScore: 92
  }
];

export async function GET() {
  return NextResponse.json({ repositories });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    // Simulate scanning process
    const newRepo = {
      id: `repo-${Date.now()}`,
      name,
      url,
      vulnerabilities: Math.floor(Math.random() * 20),
      lastScanned: new Date().toISOString(),
      status: 'scanning' as const,
      securityScore: Math.floor(Math.random() * 40) + 60
    };

    repositories.push(newRepo);

    // Simulate async scanning completion
    setTimeout(() => {
      const repo = repositories.find(r => r.id === newRepo.id);
      if (repo) {
        repo.status = 'active';
      }
    }, 3000);

    return NextResponse.json({
      success: true,
      repository: newRepo,
      scanning: true,
      message: 'Repository scanning initiated'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}