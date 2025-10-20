import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// General rate limiter for all requests
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: errorResponse(
    'Too many requests from this IP, please try again later',
    'RATE_LIMIT_EXCEEDED'
  ),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json(errorResponse(
      'Too many requests from this IP, please try again later',
      'RATE_LIMIT_EXCEEDED'
    ));
  },
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: errorResponse(
    'Too many authentication attempts, please try again later',
    'AUTH_RATE_LIMIT_EXCEEDED'
  ),
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded:', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json(errorResponse(
      'Too many authentication attempts, please try again later',
      'AUTH_RATE_LIMIT_EXCEEDED'
    ));
  },
});

// Rate limiter for scan operations (based on user subscription)
export const scanRateLimiter = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json(errorResponse(
      'Authentication required',
      'UNAUTHORIZED'
    ));
  }

  // Define limits based on subscription tier
  const limits = {
    FREE: { max: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 scans per day
    PRO: { max: 1000, windowMs: 24 * 60 * 60 * 1000 }, // 1000 scans per day
    ENTERPRISE: { max: 999999, windowMs: 60 * 60 * 1000 }, // Unlimited (high limit)
  };

  const userLimit = limits[user.subscriptionTier] || limits.FREE;
  
  const limiter = rateLimit({
    windowMs: userLimit.windowMs,
    max: userLimit.max,
    keyGenerator: (req) => `scan_${req.user.id}`, // Rate limit per user
    message: errorResponse(
      `Scan limit exceeded for ${user.subscriptionTier} tier. Upgrade your plan for more scans.`,
      'SCAN_LIMIT_EXCEEDED',
      { 
        tier: user.subscriptionTier, 
        limit: userLimit.max,
        windowHours: userLimit.windowMs / (60 * 60 * 1000)
      }
    ),
    handler: (req, res) => {
      logger.warn('Scan rate limit exceeded:', {
        userId: req.user.id,
        tier: req.user.subscriptionTier,
        ip: req.ip,
      });
      
      res.status(429).json(errorResponse(
        `Scan limit exceeded for ${user.subscriptionTier} tier. Upgrade your plan for more scans.`,
        'SCAN_LIMIT_EXCEEDED',
        { 
          tier: user.subscriptionTier, 
          limit: userLimit.max,
          windowHours: userLimit.windowMs / (60 * 60 * 1000)
        }
      ));
    },
  });

  return limiter(req, res, next);
};

// API rate limiter for external API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each IP to 1000 API requests per hour
  keyGenerator: (req) => {
    // Use API key if available, otherwise fall back to IP
    return req.headers['x-api-key'] || req.ip;
  },
  message: errorResponse(
    'API rate limit exceeded, please try again later',
    'API_RATE_LIMIT_EXCEEDED'
  ),
  handler: (req, res) => {
    logger.warn('API rate limit exceeded:', {
      apiKey: req.headers['x-api-key'],
      ip: req.ip,
      url: req.originalUrl,
    });
    
    res.status(429).json(errorResponse(
      'API rate limit exceeded, please try again later',
      'API_RATE_LIMIT_EXCEEDED'
    ));
  },
});

// WebSocket rate limiter (for connection attempts)
export const websocketRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 WebSocket connection attempts per 5 minutes
  message: 'Too many WebSocket connection attempts',
  handler: (req, res) => {
    logger.warn('WebSocket rate limit exceeded:', {
      ip: req.ip,
    });
    
    res.status(429).json(errorResponse(
      'Too many WebSocket connection attempts, please try again later',
      'WEBSOCKET_RATE_LIMIT_EXCEEDED'
    ));
  },
});