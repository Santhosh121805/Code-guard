import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

// Generate JWT token
export function generateToken(payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRY) {
  return jwt.sign(payload, secret, { expiresIn });
}

// Verify JWT token
export function verifyToken(token, secret = process.env.JWT_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
}

// Hash password
export async function hashPassword(password) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate refresh token
export async function generateRefreshToken(userId) {
  const token = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY }
  );

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return token;
}

// Verify refresh token
export async function verifyRefreshToken(token) {
  try {
    // Verify token signature
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // Check if token exists in database and is not expired
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    return refreshToken.user;
  } catch (error) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
}

// Revoke refresh token
export async function revokeRefreshToken(token) {
  await prisma.refreshToken.delete({
    where: { token },
  });
}

// Revoke all refresh tokens for a user
export async function revokeAllRefreshTokens(userId) {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

// Clean up expired refresh tokens
export async function cleanupExpiredTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  logger.info(`Cleaned up ${result.count} expired refresh tokens`);
}

// Authentication middleware
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = verifyToken(token);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId || decoded.sub },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          subscriptionTier: true,
          settings: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 401, 'USER_NOT_FOUND');
      }

      // Attach user to request
      req.user = user;
      
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    next(error);
  }
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = verifyToken(token);
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId || decoded.sub },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            subscriptionTier: true,
            settings: true,
          },
        });

        if (user) {
          req.user = user;
        }
      } catch (jwtError) {
        // Silently fail for optional authentication
        logger.debug('Optional authentication failed:', jwtError.message);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Role-based authorization middleware
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
}

// Check subscription tier
export function requireSubscription(minTier = 'FREE') {
  const tierHierarchy = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
  
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const userTierLevel = tierHierarchy[req.user.subscriptionTier] || 0;
    const requiredTierLevel = tierHierarchy[minTier] || 0;

    if (userTierLevel < requiredTierLevel) {
      return next(new AppError(
        `${minTier} subscription required`,
        403,
        'SUBSCRIPTION_REQUIRED',
        { required: minTier, current: req.user.subscriptionTier }
      ));
    }

    next();
  };
}

// Convenient aliases
export const auth = optionalAuthenticate;
export const requireAuth = authenticate;