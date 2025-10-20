import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { github } from '../services/github.js';
import { redis } from '../services/redis.js';
import { websocket } from '../services/websocket.js';
import { validateRepositoryConnection } from '../middleware/validation.js';
import { auth, requireAuth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get all repositories for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const repositories = await prisma.repository.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: {
            vulnerabilities: true,
            scans: true
          }
        },
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format response with computed fields
    const formattedRepos = repositories.map(repo => ({
      ...repo,
      vulnerabilityCount: repo._count.vulnerabilities,
      scanCount: repo._count.scans,
      lastScan: repo.scans[0] || null,
      _count: undefined,
      scans: undefined
    }));

    res.json({
      success: true,
      data: formattedRepos,
      count: formattedRepos.length
    });
  } catch (error) {
    logger.error('Failed to fetch repositories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repositories'
    });
  }
});

// Get a specific repository by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const repository = await prisma.repository.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        vulnerabilities: {
          orderBy: { severity: 'desc' },
          include: {
            _count: {
              select: { comments: true }
            }
          }
        },
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            vulnerabilities: true,
            scans: true,
            activities: true
          }
        }
      }
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    // Calculate security metrics
    const vulnerabilities = repository.vulnerabilities;
    const severityCount = {
      CRITICAL: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      HIGH: vulnerabilities.filter(v => v.severity === 'HIGH').length,
      MEDIUM: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      LOW: vulnerabilities.filter(v => v.severity === 'LOW').length
    };

    // Calculate security score (0-100)
    let securityScore = 100;
    securityScore -= severityCount.CRITICAL * 25;
    securityScore -= severityCount.HIGH * 10;
    securityScore -= severityCount.MEDIUM * 5;
    securityScore -= severityCount.LOW * 2;
    securityScore = Math.max(0, securityScore);

    const response = {
      ...repository,
      securityScore,
      severityCount,
      totalVulnerabilities: repository._count.vulnerabilities,
      totalScans: repository._count.scans,
      totalActivities: repository._count.activities,
      vulnerabilities: repository.vulnerabilities.map(vuln => ({
        ...vuln,
        commentCount: vuln._count.comments,
        _count: undefined
      }))
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Failed to fetch repository:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repository'
    });
  }
});

// Connect a new GitHub repository
router.post('/connect', requireAuth, validateRepositoryConnection, async (req, res) => {
  try {
    const { githubUrl, branch = 'main', autoScan = true } = req.body;
    
    // Extract owner and repo name from GitHub URL
    const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
    if (!urlMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub URL format'
      });
    }

    const [, owner, repoName] = urlMatch;
    const cleanRepoName = repoName.replace('.git', '');

    // Check if repository already exists for this user
    const existingRepo = await prisma.repository.findFirst({
      where: {
        userId: req.user.id,
        OR: [
          { githubUrl },
          { 
            AND: [
              { name: cleanRepoName },
              { githubUrl: { contains: `${owner}/${cleanRepoName}` } }
            ]
          }
        ]
      }
    });

    if (existingRepo) {
      return res.status(409).json({
        success: false,
        error: 'Repository is already connected'
      });
    }

    // Verify repository exists and user has access
    try {
      const repoInfo = await github.getRepository(owner, cleanRepoName, req.user.githubToken);
      
      // Create repository record
      const repository = await prisma.repository.create({
        data: {
          name: repoInfo.name,
          fullName: repoInfo.full_name,
          githubUrl: repoInfo.html_url,
          branch,
          language: repoInfo.language,
          description: repoInfo.description,
          isPrivate: repoInfo.private,
          autoScan,
          userId: req.user.id,
          githubId: repoInfo.id.toString()
        }
      });

      // Create webhook for automatic scanning
      if (autoScan && req.user.githubToken) {
        try {
          await github.createWebhook(
            owner,
            cleanRepoName,
            `${process.env.API_URL}/webhooks/github`,
            req.user.githubToken
          );
          
          await prisma.repository.update({
            where: { id: repository.id },
            data: { webhookConfigured: true }
          });
        } catch (webhookError) {
          logger.warn('Failed to create webhook:', webhookError);
          // Continue without webhook - user can still trigger manual scans
        }
      }

      // Log activity
      await prisma.activity.create({
        data: {
          type: 'REPOSITORY_CONNECTED',
          description: `Connected repository: ${repository.fullName}`,
          userId: req.user.id,
          repositoryId: repository.id
        }
      });

      // Trigger initial scan if auto-scan is enabled
      if (autoScan) {
        // Import the scanning service (we'll create this next)
        const { triggerScan } = await import('../services/scanner.js');
        triggerScan(repository.id, req.user.id).catch(error => {
          logger.error('Failed to trigger initial scan:', error);
        });
      }

      // Broadcast to WebSocket clients
      websocket.broadcast(`user:${req.user.id}`, 'repository:connected', {
        repository: {
          ...repository,
          vulnerabilityCount: 0,
          scanCount: 0,
          lastScan: null
        }
      });

      res.status(201).json({
        success: true,
        data: repository,
        message: 'Repository connected successfully'
      });
    } catch (githubError) {
      logger.error('GitHub API error:', githubError);
      return res.status(400).json({
        success: false,
        error: 'Repository not found or access denied'
      });
    }
  } catch (error) {
    logger.error('Failed to connect repository:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect repository'
    });
  }
});

// Update repository settings
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { branch, autoScan, scanSchedule } = req.body;
    
    const repository = await prisma.repository.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    const updatedRepo = await prisma.repository.update({
      where: { id: req.params.id },
      data: {
        ...(branch && { branch }),
        ...(typeof autoScan === 'boolean' && { autoScan }),
        ...(scanSchedule && { scanSchedule })
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'REPOSITORY_UPDATED',
        description: `Updated settings for repository: ${repository.name}`,
        userId: req.user.id,
        repositoryId: repository.id
      }
    });

    // Broadcast update
    websocket.broadcast(`user:${req.user.id}`, 'repository:updated', {
      repository: updatedRepo
    });

    res.json({
      success: true,
      data: updatedRepo,
      message: 'Repository settings updated'
    });
  } catch (error) {
    logger.error('Failed to update repository:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update repository'
    });
  }
});

// Disconnect/remove repository
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const repository = await prisma.repository.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    // Delete repository and all related data (cascading)
    await prisma.repository.delete({
      where: { id: req.params.id }
    });

    // Clean up cache
    await redis.del(`repo:${req.params.id}:*`);

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'REPOSITORY_DISCONNECTED',
        description: `Disconnected repository: ${repository.name}`,
        userId: req.user.id
      }
    });

    // Broadcast removal
    websocket.broadcast(`user:${req.user.id}`, 'repository:disconnected', {
      repositoryId: req.params.id
    });

    res.json({
      success: true,
      message: 'Repository disconnected successfully'
    });
  } catch (error) {
    logger.error('Failed to disconnect repository:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect repository'
    });
  }
});

// Trigger manual scan
router.post('/:id/scan', requireAuth, async (req, res) => {
  try {
    const repository = await prisma.repository.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    // Check if there's already a scan in progress
    const activeScan = await prisma.scan.findFirst({
      where: {
        repositoryId: req.params.id,
        status: 'IN_PROGRESS'
      }
    });

    if (activeScan) {
      return res.status(409).json({
        success: false,
        error: 'A scan is already in progress for this repository'
      });
    }

    // Import and trigger scan
    const { triggerScan } = await import('../services/scanner.js');
    const scan = await triggerScan(req.params.id, req.user.id);

    res.json({
      success: true,
      data: scan,
      message: 'Scan triggered successfully'
    });
  } catch (error) {
    logger.error('Failed to trigger scan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger scan'
    });
  }
});

// Get repository statistics
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const repository = await prisma.repository.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    // Check cache first
    const cacheKey = `repo:${req.params.id}:stats`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Calculate statistics
    const [
      vulnerabilityStats,
      scanStats,
      severityDistribution,
      trendData
    ] = await Promise.all([
      // Vulnerability statistics
      prisma.vulnerability.aggregate({
        where: { repositoryId: req.params.id },
        _count: { id: true }
      }),
      
      // Scan statistics
      prisma.scan.aggregate({
        where: { repositoryId: req.params.id },
        _count: { id: true }
      }),
      
      // Severity distribution
      prisma.vulnerability.groupBy({
        by: ['severity'],
        where: { repositoryId: req.params.id },
        _count: { id: true }
      }),
      
      // Trend data (last 30 days)
      prisma.vulnerability.findMany({
        where: {
          repositoryId: req.params.id,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          createdAt: true,
          severity: true
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const stats = {
      totalVulnerabilities: vulnerabilityStats._count.id,
      totalScans: scanStats._count.id,
      severityDistribution: severityDistribution.reduce((acc, item) => {
        acc[item.severity] = item._count.id;
        return acc;
      }, {}),
      trendData: trendData.reduce((acc, vuln) => {
        const date = vuln.createdAt.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        acc[date][vuln.severity]++;
        return acc;
      }, {}),
      lastUpdated: new Date().toISOString()
    };

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(stats));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to fetch repository stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Get repository activity timeline
router.get('/:id/activity', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const repository = await prisma.repository.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { repositoryId: req.params.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.activity.count({
        where: { repositoryId: req.params.id }
      })
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch repository activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    });
  }
});

export default router;