import { logger } from '../utils/logger.js';

export class WebSocketService {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Map(); // Map user IDs to WebSocket connections
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      logger.info('WebSocket connection established', { 
        ip: req.socket.remoteAddress 
      });

      // Handle authentication
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          logger.error('WebSocket message parse error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', (code, reason) => {
        logger.info('WebSocket connection closed', { 
          code, 
          reason: reason.toString(),
          userId: ws.userId 
        });
        
        if (ws.userId) {
          this.clients.delete(ws.userId);
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });

      // Send welcome message
      this.send(ws, {
        type: 'connection',
        data: {
          status: 'connected',
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  handleMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'auth':
        this.handleAuth(ws, payload);
        break;
      
      case 'subscribe':
        this.handleSubscribe(ws, payload);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscribe(ws, payload);
        break;
      
      case 'ping':
        this.handlePing(ws);
        break;
      
      default:
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  async handleAuth(ws, payload) {
    try {
      const { token } = payload;
      
      if (!token) {
        this.sendError(ws, 'Authentication token required');
        return;
      }

      // Verify JWT token (you'll need to import the auth middleware)
      const { verifyToken } = await import('../middleware/auth.js');
      const decoded = verifyToken(token);
      
      // Get user from database
      const { prisma } = await import('../database/connection.js');
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId || decoded.sub },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
        },
      });

      if (!user) {
        this.sendError(ws, 'User not found');
        return;
      }

      // Store user info on WebSocket connection
      ws.userId = user.id;
      ws.user = user;
      ws.isAuthenticated = true;
      ws.subscriptions = new Set(); // Track subscriptions

      // Add to clients map
      this.clients.set(user.id, ws);

      // Send authentication success
      this.send(ws, {
        type: 'auth',
        data: {
          status: 'authenticated',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            subscriptionTier: user.subscriptionTier,
          },
          timestamp: new Date().toISOString(),
        },
      });

      logger.info('WebSocket user authenticated', { userId: user.id });

    } catch (error) {
      logger.error('WebSocket auth error:', error);
      this.sendError(ws, 'Authentication failed');
    }
  }

  handleSubscribe(ws, payload) {
    if (!ws.isAuthenticated) {
      this.sendError(ws, 'Authentication required');
      return;
    }

    const { channels } = payload;
    
    if (!Array.isArray(channels)) {
      this.sendError(ws, 'Channels must be an array');
      return;
    }

    channels.forEach(channel => {
      if (this.isValidChannel(ws, channel)) {
        ws.subscriptions.add(channel);
        logger.debug('WebSocket subscribed to channel', { 
          userId: ws.userId, 
          channel 
        });
      } else {
        this.sendError(ws, `Invalid or unauthorized channel: ${channel}`);
      }
    });

    this.send(ws, {
      type: 'subscribe',
      data: {
        channels: Array.from(ws.subscriptions),
        timestamp: new Date().toISOString(),
      },
    });
  }

  handleUnsubscribe(ws, payload) {
    if (!ws.isAuthenticated) {
      this.sendError(ws, 'Authentication required');
      return;
    }

    const { channels } = payload;
    
    if (!Array.isArray(channels)) {
      this.sendError(ws, 'Channels must be an array');
      return;
    }

    channels.forEach(channel => {
      ws.subscriptions.delete(channel);
    });

    this.send(ws, {
      type: 'unsubscribe',
      data: {
        channels: Array.from(ws.subscriptions),
        timestamp: new Date().toISOString(),
      },
    });
  }

  handlePing(ws) {
    this.send(ws, {
      type: 'pong',
      data: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  isValidChannel(ws, channel) {
    // Validate that user has access to the channel
    const [type, resourceId] = channel.split(':');
    
    switch (type) {
      case 'user':
        // User can only subscribe to their own user channel
        return resourceId === ws.userId;
      
      case 'repository':
        // TODO: Check if user has access to repository
        return true; // For now, allow all authenticated users
      
      case 'scan':
        // TODO: Check if user has access to scan
        return true; // For now, allow all authenticated users
      
      case 'global':
        // Global channels for system notifications
        return ['announcements', 'status'].includes(resourceId);
      
      default:
        return false;
    }
  }

  send(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, error) {
    this.send(ws, {
      type: 'error',
      data: {
        error,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Broadcast to all connected clients
  broadcast(message) {
    this.clients.forEach((ws) => {
      this.send(ws, message);
    });
  }

  // Send to specific user
  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws) {
      this.send(ws, message);
      return true;
    }
    return false;
  }

  // Send to users subscribed to a channel
  sendToChannel(channel, message) {
    let sentCount = 0;
    
    this.clients.forEach((ws) => {
      if (ws.subscriptions && ws.subscriptions.has(channel)) {
        this.send(ws, message);
        sentCount++;
      }
    });
    
    return sentCount;
  }

  // Send scan progress updates
  sendScanProgress(repositoryId, progress) {
    const message = {
      type: 'scan:progress',
      data: {
        repositoryId,
        progress,
        timestamp: new Date().toISOString(),
      },
    };

    this.sendToChannel(`repository:${repositoryId}`, message);
  }

  // Send scan started notification
  sendScanStarted(repositoryId, scanId) {
    const message = {
      type: 'scan:started',
      data: {
        repositoryId,
        scanId,
        timestamp: new Date().toISOString(),
      },
    };

    this.sendToChannel(`repository:${repositoryId}`, message);
  }

  // Send scan completed notification
  sendScanCompleted(repositoryId, scanId, results) {
    const message = {
      type: 'scan:completed',
      data: {
        repositoryId,
        scanId,
        results,
        timestamp: new Date().toISOString(),
      },
    };

    this.sendToChannel(`repository:${repositoryId}`, message);
  }

  // Send vulnerability found notification
  sendVulnerabilityFound(repositoryId, vulnerability) {
    const message = {
      type: 'vulnerability:found',
      data: {
        repositoryId,
        vulnerability,
        timestamp: new Date().toISOString(),
      },
    };

    this.sendToChannel(`repository:${repositoryId}`, message);
  }

  // Send fix applied notification
  sendFixApplied(vulnerabilityId, pullRequestUrl) {
    const message = {
      type: 'fix:applied',
      data: {
        vulnerabilityId,
        pullRequestUrl,
        timestamp: new Date().toISOString(),
      },
    };

    // Send to all clients for now, could be more targeted
    this.broadcast(message);
  }

  // Send pull request merged notification
  sendPullRequestMerged(repositoryId, pullRequestNumber, vulnerabilityId) {
    const message = {
      type: 'pr:merged',
      data: {
        repositoryId,
        pullRequestNumber,
        vulnerabilityId,
        timestamp: new Date().toISOString(),
      },
    };

    this.sendToChannel(`repository:${repositoryId}`, message);
  }

  // Send system notification
  sendSystemNotification(type, title, message, severity = 'info') {
    const notification = {
      type: 'notification',
      data: {
        notificationType: type,
        title,
        message,
        severity,
        timestamp: new Date().toISOString(),
      },
    };

    this.sendToChannel('global:announcements', notification);
  }

  // Get connection statistics
  getStats() {
    const authenticatedClients = Array.from(this.clients.values())
      .filter(ws => ws.isAuthenticated).length;

    return {
      totalConnections: this.clients.size,
      authenticatedConnections: authenticatedClients,
      totalSubscriptions: Array.from(this.clients.values())
        .reduce((total, ws) => total + (ws.subscriptions ? ws.subscriptions.size : 0), 0),
    };
  }

  // Close connection for user (e.g., on logout)
  disconnectUser(userId) {
    const ws = this.clients.get(userId);
    if (ws) {
      ws.close(1000, 'User logged out');
      this.clients.delete(userId);
      return true;
    }
    return false;
  }

  // Clean up closed connections
  cleanup() {
    for (const [userId, ws] of this.clients.entries()) {
      if (ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
        this.clients.delete(userId);
        logger.debug('Cleaned up closed WebSocket connection', { userId });
      }
    }
  }
}

// Export WebSocket instance for use in other modules
let websocketService = null;

export function setWebSocketService(service) {
  websocketService = service;
}

export function getWebSocketService() {
  return websocketService;
}

// Export singleton instance for easy access
export const websocket = websocketService;