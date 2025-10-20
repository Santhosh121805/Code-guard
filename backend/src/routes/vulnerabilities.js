import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateVulnerability } from '../middleware/validation.js';
import { redis } from '../services/redis.js';
import { websocket } from '../services/websocket.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get all vulnerabilities for a repository
router.get('/repository/:repositoryId', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, type, status = 'OPEN' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify repository access
    const repository = await prisma.repository.findFirst({
      where: {
        id: req.params.repositoryId,
        userId: req.user.id
      }
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    // Build filters
    const where = {
      repositoryId: req.params.repositoryId,
      ...(status && { status }),
      ...(severity && { severity }),
      ...(type && { type })
    };

    const [vulnerabilities, total] = await Promise.all([
      prisma.vulnerability.findMany({
        where,
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.vulnerability.count({ where })
    ]);

    // Format response
    const formattedVulns = vulnerabilities.map(vuln => ({
      ...vuln,
      commentCount: vuln._count.comments,
      recentComments: vuln.comments,
      _count: undefined,
      comments: undefined
    }));

    res.json({
      success: true,
      data: formattedVulns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch vulnerabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vulnerabilities'
    });
  }
});

// Get vulnerability by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const vulnerability = await prisma.vulnerability.findFirst({
      where: { id: req.params.id },
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            userId: true
          }
        },
        scan: {
          select: {
            id: true,
            createdAt: true,
            scanType: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!vulnerability) {
      return res.status(404).json({
        success: false,
        error: 'Vulnerability not found'
      });
    }

    // Check access permission
    if (vulnerability.repository.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: vulnerability
    });
  } catch (error) {
    logger.error('Failed to fetch vulnerability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vulnerability'
    });
  }
});

// Update vulnerability status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status, resolution } = req.body;

    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'IGNORED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const vulnerability = await prisma.vulnerability.findFirst({
      where: { id: req.params.id },
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            userId: true
          }
        }
      }
    });

    if (!vulnerability) {
      return res.status(404).json({
        success: false,
        error: 'Vulnerability not found'
      });
    }

    if (vulnerability.repository.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updatedVuln = await prisma.vulnerability.update({
      where: { id: req.params.id },
      data: {
        status,
        resolution,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
        resolvedBy: status === 'RESOLVED' ? req.user.id : null
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'VULNERABILITY_STATUS_CHANGED',
        description: `Vulnerability status changed to ${status}: ${vulnerability.title}`,
        userId: req.user.id,
        repositoryId: vulnerability.repositoryId
      }
    });

    // Clear repository stats cache
    await redis.del(`repo:${vulnerability.repositoryId}:stats`);

    // Broadcast update
    websocket.broadcast(`user:${req.user.id}`, 'vulnerability:updated', {
      vulnerabilityId: req.params.id,
      repositoryId: vulnerability.repositoryId,
      status,
      resolution
    });

    res.json({
      success: true,
      data: updatedVuln,
      message: 'Vulnerability status updated'
    });
  } catch (error) {
    logger.error('Failed to update vulnerability status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vulnerability status'
    });
  }
});

// Add comment to vulnerability
router.post('/:id/comments', requireAuth, validateVulnerability, async (req, res) => {
  try {
    const { content } = req.body;

    const vulnerability = await prisma.vulnerability.findFirst({
      where: { id: req.params.id },
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            userId: true
          }
        }
      }
    });

    if (!vulnerability) {
      return res.status(404).json({
        success: false,
        error: 'Vulnerability not found'
      });
    }

    if (vulnerability.repository.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        vulnerabilityId: req.params.id,
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'COMMENT_ADDED',
        description: `Comment added to vulnerability: ${vulnerability.title}`,
        userId: req.user.id,
        repositoryId: vulnerability.repositoryId
      }
    });

    // Broadcast new comment
    websocket.broadcast(`user:${req.user.id}`, 'comment:added', {
      vulnerabilityId: req.params.id,
      repositoryId: vulnerability.repositoryId,
      comment
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    logger.error('Failed to add comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// Delete comment
router.delete('/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const comment = await prisma.comment.findFirst({
      where: { id: req.params.commentId },
      include: {
        vulnerability: {
          include: {
            repository: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check permission (owner of comment or repository owner)
    if (comment.userId !== req.user.id && comment.vulnerability.repository.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await prisma.comment.delete({
      where: { id: req.params.commentId }
    });

    // Broadcast comment deletion
    websocket.broadcast(`user:${req.user.id}`, 'comment:deleted', {
      commentId: req.params.commentId,
      vulnerabilityId: comment.vulnerabilityId,
      repositoryId: comment.vulnerability.repositoryId
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

// Get vulnerability statistics
router.get('/stats/overview', requireAuth, async (req, res) => {
  try {
    const { repositoryId, timeframe = '30d' } = req.query;

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
      default:
        dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build base filter
    const baseFilter = {
      repository: { userId: req.user.id },
      ...(repositoryId && { repositoryId }),
      createdAt: dateFilter
    };

    // Get comprehensive stats
    const [
      totalStats,
      severityDistribution,
      typeDistribution,
      statusDistribution,
      trendData,
      recentVulnerabilities
    ] = await Promise.all([
      // Total vulnerability stats
      prisma.vulnerability.aggregate({
        where: baseFilter,
        _count: { id: true }
      }),

      // Severity distribution
      prisma.vulnerability.groupBy({
        by: ['severity'],
        where: baseFilter,
        _count: { id: true }
      }),

      // Type distribution
      prisma.vulnerability.groupBy({
        by: ['type'],
        where: baseFilter,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),

      // Status distribution
      prisma.vulnerability.groupBy({
        by: ['status'],
        where: baseFilter,
        _count: { id: true }
      }),

      // Daily trend data
      prisma.vulnerability.findMany({
        where: baseFilter,
        select: {
          createdAt: true,
          severity: true,
          status: true
        }
      }),

      // Recent vulnerabilities
      prisma.vulnerability.findMany({
        where: baseFilter,
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
      })
    ]);

    // Process trend data by day
    const trendByDay = trendData.reduce((acc, vuln) => {
      const day = vuln.createdAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { 
          date: day,
          total: 0,
          CRITICAL: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0,
          resolved: 0
        };
      }
      acc[day].total++;
      acc[day][vuln.severity]++;
      if (vuln.status === 'RESOLVED') {
        acc[day].resolved++;
      }
      return acc;
    }, {});

    const stats = {
      overview: {
        totalVulnerabilities: totalStats._count.id,
        severityDistribution: severityDistribution.reduce((acc, item) => {
          acc[item.severity] = item._count.id;
          return acc;
        }, {}),
        typeDistribution: typeDistribution.map(item => ({
          type: item.type,
          count: item._count.id
        })),
        statusDistribution: statusDistribution.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {})
      },
      trends: {
        daily: Object.values(trendByDay).sort((a, b) => a.date.localeCompare(b.date))
      },
      recent: recentVulnerabilities,
      timeframe,
      generatedAt: new Date().toISOString()
    };

    // Cache the results for 5 minutes
    const cacheKey = `vuln:stats:${req.user.id}:${repositoryId || 'all'}:${timeframe}`;
    await redis.setex(cacheKey, 300, JSON.stringify(stats));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to fetch vulnerability statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Bulk update vulnerabilities
router.patch('/bulk/update', requireAuth, async (req, res) => {
  try {
    const { vulnerabilityIds, updates } = req.body;

    if (!Array.isArray(vulnerabilityIds) || vulnerabilityIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vulnerability IDs'
      });
    }

    // Verify all vulnerabilities belong to user
    const vulnerabilities = await prisma.vulnerability.findMany({
      where: {
        id: { in: vulnerabilityIds },
        repository: { userId: req.user.id }
      },
      select: {
        id: true,
        title: true,
        repositoryId: true
      }
    });

    if (vulnerabilities.length !== vulnerabilityIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Some vulnerabilities not found or access denied'
      });
    }

    // Perform bulk update
    const result = await prisma.vulnerability.updateMany({
      where: {
        id: { in: vulnerabilityIds }
      },
      data: {
        ...updates,
        ...(updates.status === 'RESOLVED' && {
          resolvedAt: new Date(),
          resolvedBy: req.user.id
        })
      }
    });

    // Log activity for each repository
    const repositoryIds = [...new Set(vulnerabilities.map(v => v.repositoryId))];
    for (const repositoryId of repositoryIds) {
      const repoVulns = vulnerabilities.filter(v => v.repositoryId === repositoryId);
      await prisma.activity.create({
        data: {
          type: 'BULK_UPDATE',
          description: `Bulk updated ${repoVulns.length} vulnerabilities`,
          userId: req.user.id,
          repositoryId
        }
      });

      // Clear cache
      await redis.del(`repo:${repositoryId}:stats`);
    }

    // Broadcast update
    websocket.broadcast(`user:${req.user.id}`, 'vulnerabilities:bulk_updated', {
      vulnerabilityIds,
      updates,
      count: result.count
    });

    res.json({
      success: true,
      data: { updatedCount: result.count },
      message: `${result.count} vulnerabilities updated successfully`
    });
  } catch (error) {
    logger.error('Failed to bulk update vulnerabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vulnerabilities'
    });
  }
});

export default router;