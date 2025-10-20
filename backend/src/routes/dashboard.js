import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { redis } from '../services/redis.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get dashboard overview statistics
router.get('/overview', requireAuth, async (req, res) => {
  try {
    // Check cache first
    const cacheKey = `dashboard:${req.user.id}:overview`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Get comprehensive dashboard data
    const [
      repositoryCount,
      vulnerabilityStats,
      scanStats,
      recentActivity,
      criticalVulnerabilities,
      securityScores
    ] = await Promise.all([
      // Repository count
      prisma.repository.count({
        where: { userId: req.user.id }
      }),

      // Vulnerability statistics
      prisma.vulnerability.groupBy({
        by: ['severity', 'status'],
        where: { repository: { userId: req.user.id } },
        _count: { id: true }
      }),

      // Scan statistics  
      prisma.scan.aggregate({
        where: { userId: req.user.id },
        _count: { id: true },
        _max: { createdAt: true }
      }),

      // Recent activity (last 10 items)
      prisma.activity.findMany({
        where: { userId: req.user.id },
        include: {
          repository: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Critical vulnerabilities that need attention
      prisma.vulnerability.findMany({
        where: {
          repository: { userId: req.user.id },
          severity: 'CRITICAL',
          status: 'OPEN'
        },
        include: {
          repository: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Repository security scores
      prisma.repository.findMany({
        where: { userId: req.user.id },
        select: {
          id: true,
          name: true,
          securityScore: true,
          lastScanAt: true,
          _count: {
            select: {
              vulnerabilities: {
                where: { status: 'OPEN' }
              }
            }
          }
        },
        orderBy: { securityScore: 'asc' }
      })
    ]);

    // Process vulnerability statistics
    const vulnsByStatus = vulnerabilityStats.reduce((acc, item) => {
      if (!acc[item.status]) acc[item.status] = {};
      acc[item.status][item.severity] = item._count.id;
      return acc;
    }, {});

    const vulnsBySeverity = vulnerabilityStats.reduce((acc, item) => {
      if (!acc[item.severity]) acc[item.severity] = 0;
      acc[item.severity] += item._count.id;
      return acc;
    }, {});

    // Calculate totals
    const totalVulnerabilities = Object.values(vulnsBySeverity).reduce((sum, count) => sum + count, 0);
    const openVulnerabilities = vulnsByStatus.OPEN ? 
      Object.values(vulnsByStatus.OPEN).reduce((sum, count) => sum + count, 0) : 0;

    // Calculate average security score
    const avgSecurityScore = securityScores.length > 0 ?
      Math.round(securityScores.reduce((sum, repo) => sum + (repo.securityScore || 0), 0) / securityScores.length) : 100;

    // Prepare dashboard data
    const dashboardData = {
      overview: {
        repositoryCount,
        totalVulnerabilities,
        openVulnerabilities,
        totalScans: scanStats._count.id,
        lastScanDate: scanStats._max.createdAt,
        averageSecurityScore: avgSecurityScore
      },
      vulnerabilities: {
        bySeverity: {
          CRITICAL: vulnsBySeverity.CRITICAL || 0,
          HIGH: vulnsBySeverity.HIGH || 0,
          MEDIUM: vulnsBySeverity.MEDIUM || 0,
          LOW: vulnsBySeverity.LOW || 0
        },
        byStatus: vulnsByStatus
      },
      repositories: securityScores.map(repo => ({
        id: repo.id,
        name: repo.name,
        securityScore: repo.securityScore || 0,
        openVulnerabilities: repo._count.vulnerabilities,
        lastScanAt: repo.lastScanAt,
        needsAttention: (repo.securityScore || 0) < 70 || repo._count.vulnerabilities > 0
      })),
      criticalAlerts: criticalVulnerabilities.map(vuln => ({
        id: vuln.id,
        title: vuln.title,
        repository: vuln.repository,
        filePath: vuln.filePath,
        discoveredAt: vuln.discoveredAt,
        daysOpen: Math.floor((Date.now() - new Date(vuln.discoveredAt).getTime()) / (1000 * 60 * 60 * 24))
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        repository: activity.repository,
        createdAt: activity.createdAt,
        timeAgo: this.getTimeAgo(activity.createdAt)
      })),
      generatedAt: new Date().toISOString()
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(dashboardData));

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Failed to fetch dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Get vulnerability trends for charts
router.get('/trends', requireAuth, async (req, res) => {
  try {
    const { timeframe = '30d', repositoryId } = req.query;

    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    switch (timeframe) {
      case '7d':
        dateFilter.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter.gte = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        dateFilter.gte = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const baseFilter = {
      repository: { userId: req.user.id },
      ...(repositoryId && { repositoryId }),
      discoveredAt: dateFilter
    };

    const [vulnerabilityTrends, scanTrends] = await Promise.all([
      // Vulnerability discovery trends
      prisma.vulnerability.findMany({
        where: baseFilter,
        select: {
          discoveredAt: true,
          severity: true,
          status: true,
          resolvedAt: true
        },
        orderBy: { discoveredAt: 'asc' }
      }),

      // Scan execution trends
      prisma.scan.findMany({
        where: {
          userId: req.user.id,
          ...(repositoryId && { repositoryId }),
          createdAt: dateFilter
        },
        select: {
          createdAt: true,
          status: true,
          vulnerabilitiesFound: true,
          securityScore: true
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // Process vulnerability trends by day
    const vulnTrendsByDay = vulnerabilityTrends.reduce((acc, vuln) => {
      const day = vuln.discoveredAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = {
          date: day,
          discovered: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
          resolved: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
        };
      }
      acc[day].discovered[vuln.severity]++;
      
      // Count resolved on resolution date
      if (vuln.resolvedAt && vuln.status === 'RESOLVED') {
        const resolveDay = vuln.resolvedAt.toISOString().split('T')[0];
        if (!acc[resolveDay]) {
          acc[resolveDay] = {
            date: resolveDay,
            discovered: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
            resolved: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
          };
        }
        acc[resolveDay].resolved[vuln.severity]++;
      }
      return acc;
    }, {});

    // Process scan trends by day
    const scanTrendsByDay = scanTrends.reduce((acc, scan) => {
      const day = scan.createdAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = {
          date: day,
          scans: 0,
          totalVulnerabilities: 0,
          avgSecurityScore: 0,
          securityScores: []
        };
      }
      acc[day].scans++;
      acc[day].totalVulnerabilities += scan.vulnerabilitiesFound || 0;
      if (scan.securityScore !== null) {
        acc[day].securityScores.push(scan.securityScore);
      }
      return acc;
    }, {});

    // Calculate average security scores
    Object.values(scanTrendsByDay).forEach(day => {
      if (day.securityScores.length > 0) {
        day.avgSecurityScore = Math.round(
          day.securityScores.reduce((sum, score) => sum + score, 0) / day.securityScores.length
        );
      }
      delete day.securityScores; // Remove raw scores from response
    });

    // Fill in missing days with zero values
    const startDate = dateFilter.gte;
    const endDate = now;
    const allDays = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.toISOString().split('T')[0];
      allDays.push({
        date: day,
        vulnerabilities: vulnTrendsByDay[day] || {
          date: day,
          discovered: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
          resolved: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
        },
        scans: scanTrendsByDay[day] || {
          date: day,
          scans: 0,
          totalVulnerabilities: 0,
          avgSecurityScore: null
        }
      });
    }

    const trends = {
      timeframe,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      data: allDays,
      summary: {
        totalVulnerabilitiesDiscovered: vulnerabilityTrends.length,
        totalVulnerabilitiesResolved: vulnerabilityTrends.filter(v => v.status === 'RESOLVED').length,
        totalScans: scanTrends.length,
        averageVulnerabilitiesPerScan: scanTrends.length > 0 ? 
          Math.round(scanTrends.reduce((sum, s) => sum + (s.vulnerabilitiesFound || 0), 0) / scanTrends.length) : 0
      }
    };

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Failed to fetch dashboard trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends data'
    });
  }
});

// Get security score breakdown
router.get('/security-score', requireAuth, async (req, res) => {
  try {
    const { repositoryId } = req.query;

    const repositories = await prisma.repository.findMany({
      where: {
        userId: req.user.id,
        ...(repositoryId && { id: repositoryId })
      },
      include: {
        vulnerabilities: {
          where: { status: 'OPEN' },
          select: {
            severity: true,
            type: true
          }
        },
        _count: {
          select: {
            scans: true,
            vulnerabilities: true
          }
        }
      }
    });

    const scoreBreakdown = repositories.map(repo => {
      const vulns = repo.vulnerabilities;
      const severityCounts = {
        CRITICAL: vulns.filter(v => v.severity === 'CRITICAL').length,
        HIGH: vulns.filter(v => v.severity === 'HIGH').length,
        MEDIUM: vulns.filter(v => v.severity === 'MEDIUM').length,
        LOW: vulns.filter(v => v.severity === 'LOW').length
      };

      // Calculate base score (100) and deductions
      let baseScore = 100;
      const deductions = {
        CRITICAL: severityCounts.CRITICAL * 25,
        HIGH: severityCounts.HIGH * 10,
        MEDIUM: severityCounts.MEDIUM * 5,
        LOW: severityCounts.LOW * 2
      };

      const totalDeductions = Object.values(deductions).reduce((sum, d) => sum + d, 0);
      const finalScore = Math.max(0, baseScore - totalDeductions);

      // Get vulnerability type distribution
      const typeDistribution = vulns.reduce((acc, vuln) => {
        acc[vuln.type] = (acc[vuln.type] || 0) + 1;
        return acc;
      }, {});

      return {
        repository: {
          id: repo.id,
          name: repo.name,
          lastScanAt: repo.lastScanAt
        },
        securityScore: finalScore,
        calculation: {
          baseScore,
          deductions,
          totalDeductions,
          finalScore
        },
        vulnerabilities: {
          total: vulns.length,
          bySeverity: severityCounts,
          byType: Object.entries(typeDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }))
        },
        recommendations: generateSecurityRecommendations(severityCounts, finalScore),
        metrics: {
          totalScans: repo._count.scans,
          totalVulnerabilities: repo._count.vulnerabilities,
          riskLevel: getRiskLevel(finalScore),
          needsImprovement: finalScore < 70
        }
      };
    });

    res.json({
      success: true,
      data: repositoryId ? scoreBreakdown[0] : scoreBreakdown
    });
  } catch (error) {
    logger.error('Failed to fetch security score breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security score'
    });
  }
});

// Helper functions
function generateSecurityRecommendations(severityCounts, score) {
  const recommendations = [];

  if (severityCounts.CRITICAL > 0) {
    recommendations.push({
      priority: 'HIGH',
      message: `Address ${severityCounts.CRITICAL} critical vulnerabilities immediately`,
      action: 'Review and fix critical security issues'
    });
  }

  if (severityCounts.HIGH > 5) {
    recommendations.push({
      priority: 'HIGH', 
      message: `${severityCounts.HIGH} high-severity vulnerabilities need attention`,
      action: 'Prioritize fixing high-severity issues'
    });
  }

  if (score < 50) {
    recommendations.push({
      priority: 'HIGH',
      message: 'Security score is critically low',
      action: 'Implement comprehensive security review'
    });
  } else if (score < 70) {
    recommendations.push({
      priority: 'MEDIUM',
      message: 'Security score needs improvement',
      action: 'Focus on reducing medium and high-severity vulnerabilities'
    });
  }

  if (severityCounts.MEDIUM + severityCounts.LOW > 20) {
    recommendations.push({
      priority: 'LOW',
      message: 'High number of minor vulnerabilities',
      action: 'Consider automated fixes for low-impact issues'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'LOW',
      message: 'Good security posture maintained',
      action: 'Continue regular security scans'
    });
  }

  return recommendations;
}

function getRiskLevel(score) {
  if (score >= 80) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 40) return 'HIGH';
  return 'CRITICAL';
}

function getTimeAgo(date) {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default router;