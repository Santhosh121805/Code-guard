import { NextResponse } from 'next/server';

export async function GET() {
  // Mock dashboard statistics
  const stats = {
    totalRepositories: 12,
    totalVulnerabilities: 47,
    criticalIssues: 8,
    resolvedIssues: 23,
    weeklyTrends: {
      vulnerabilities: [12, 15, 8, 19, 14, 11, 16],
      repositories: [10, 10, 11, 11, 12, 12, 12],
      resolutions: [3, 5, 2, 8, 4, 6, 7]
    }
  };

  return NextResponse.json(stats);
}