import { prisma } from '../database/connection.js';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens 
} from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { GitHubService } from '../services/github.js';
import { EmailService } from '../services/email.js';
import crypto from 'crypto';

const githubService = new GitHubService();
const emailService = new EmailService();

// Register new user
export async function register(req, res, next) {
  try {
    const { email, password, name, username } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(username ? [{ username }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
      }
      if (existingUser.username === username) {
        throw new AppError('Username already taken', 409, 'USERNAME_EXISTS');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        username,
        role: 'USER',
        subscriptionTier: 'FREE',
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateToken({ userId: user.id, email: user.email });
    const refreshToken = await generateRefreshToken(user.id);

    // Send verification email (async)
    emailService.sendVerificationEmail(user.email, user.name).catch(error => {
      logger.error('Failed to send verification email:', error);
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    res.status(201).json(successResponse({
      user,
      accessToken,
      refreshToken,
    }, 'User registered successfully'));

  } catch (error) {
    next(error);
  }
}

// Login user
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        passwordHash: true,
        role: true,
        subscriptionTier: true,
        emailVerified: true,
        settings: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    // Generate tokens
    const accessToken = generateToken({ userId: user.id, email: user.email });
    const refreshToken = await generateRefreshToken(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    res.json(successResponse({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    }, 'Login successful'));

  } catch (error) {
    next(error);
  }
}

// Logout user
export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    if (refreshToken) {
      // Revoke specific refresh token
      await revokeRefreshToken(refreshToken);
    } else {
      // Revoke all refresh tokens for user
      await revokeAllRefreshTokens(userId);
    }

    logger.info('User logged out', { userId });

    res.json(successResponse(null, 'Logout successful'));

  } catch (error) {
    next(error);
  }
}

// Refresh access token
export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400, 'REFRESH_TOKEN_REQUIRED');
    }

    // Verify refresh token
    const user = await verifyRefreshToken(refreshToken);

    // Generate new access token
    const newAccessToken = generateToken({ userId: user.id, email: user.email });

    // Optionally generate new refresh token (token rotation)
    const newRefreshToken = await generateRefreshToken(user.id);
    
    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    res.json(successResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, 'Tokens refreshed successfully'));

  } catch (error) {
    next(error);
  }
}

// Get user profile
export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        emailVerified: true,
        emailVerifiedAt: true,
        settings: true,
        createdAt: true,
        lastLoginAt: true,
        githubUsername: true,
        _count: {
          select: {
            repositories: true,
            activities: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json(successResponse(user, 'Profile retrieved successfully'));

  } catch (error) {
    next(error);
  }
}

// Update user profile
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, username, settings } = req.body;

    // Check if username is taken (if being updated)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new AppError('Username already taken', 409, 'USERNAME_EXISTS');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
        ...(settings !== undefined && { settings }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        settings: true,
      },
    });

    logger.info('User profile updated', { userId, changes: Object.keys(req.body) });

    res.json(successResponse(updatedUser, 'Profile updated successfully'));

  } catch (error) {
    next(error);
  }
}

// Change password
export async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens to force re-login on all devices
    await revokeAllRefreshTokens(userId);

    logger.info('User password changed', { userId });

    res.json(successResponse(null, 'Password changed successfully'));

  } catch (error) {
    next(error);
  }
}

// Initiate GitHub OAuth
export async function initiateGitHubAuth(req, res, next) {
  try {
    const githubAuthUrl = githubService.getAuthUrl();
    
    res.json(successResponse({
      authUrl: githubAuthUrl,
    }, 'GitHub authentication URL generated'));

  } catch (error) {
    next(error);
  }
}

// GitHub OAuth callback
export async function githubCallback(req, res, next) {
  try {
    const { code } = req.query;

    if (!code) {
      throw new AppError('Authorization code required', 400, 'CODE_REQUIRED');
    }

    // Exchange code for access token
    const { accessToken: githubToken, user: githubUser } = await githubService.exchangeCodeForToken(code);

    // Check if user already exists with this GitHub ID
    let user = await prisma.user.findUnique({
      where: { githubId: githubUser.id.toString() },
    });

    if (user) {
      // Update GitHub access token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          githubAccessToken: githubToken, // Should be encrypted in production
          githubUsername: githubUser.login,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Check if user exists with the same email
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: githubUser.email },
      });

      if (existingEmailUser) {
        // Link GitHub account to existing user
        user = await prisma.user.update({
          where: { id: existingEmailUser.id },
          data: {
            githubId: githubUser.id.toString(),
            githubAccessToken: githubToken, // Should be encrypted in production
            githubUsername: githubUser.login,
            lastLoginAt: new Date(),
            ...(githubUser.name && !existingEmailUser.name && { name: githubUser.name }),
            ...(githubUser.avatar_url && !existingEmailUser.avatar && { avatar: githubUser.avatar_url }),
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: githubUser.email,
            name: githubUser.name,
            username: githubUser.login,
            avatar: githubUser.avatar_url,
            githubId: githubUser.id.toString(),
            githubAccessToken: githubToken, // Should be encrypted in production
            githubUsername: githubUser.login,
            role: 'USER',
            subscriptionTier: 'FREE',
            emailVerified: true, // GitHub emails are considered verified
            emailVerifiedAt: new Date(),
          },
        });
      }
    }

    // Remove sensitive data for response
    const { passwordHash, githubAccessToken, ...userForResponse } = user;

    // Generate our app tokens
    const accessToken = generateToken({ userId: user.id, email: user.email });
    const refreshToken = await generateRefreshToken(user.id);

    logger.info('GitHub OAuth successful', { userId: user.id, githubId: githubUser.id });

    res.json(successResponse({
      user: userForResponse,
      accessToken,
      refreshToken,
    }, 'GitHub authentication successful'));

  } catch (error) {
    next(error);
  }
}

// Verify email
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.params;

    // In a real implementation, you'd store verification tokens in the database
    // For now, we'll decode a JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      logger.info('Email verified successfully', { userId: user.id });

      res.json(successResponse(null, 'Email verified successfully'));

    } catch (jwtError) {
      throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
    }

  } catch (error) {
    next(error);
  }
}

// Resend verification email
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.emailVerified) {
      throw new AppError('Email already verified', 400, 'EMAIL_ALREADY_VERIFIED');
    }

    // Send verification email
    await emailService.sendVerificationEmail(email, user.name);

    res.json(successResponse(null, 'Verification email sent'));

  } catch (error) {
    next(error);
  }
}

// Forgot password
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    if (!user) {
      // Don't reveal whether user exists
      res.json(successResponse(null, 'If the email exists, a reset link has been sent'));
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token (you'd want to add these fields to your User model)
    // For now, we'll use JWT with expiry
    const resetTokenJWT = generateToken(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      '1h'
    );

    // Send reset email
    await emailService.sendPasswordResetEmail(email, user.name, resetTokenJWT);

    logger.info('Password reset requested', { userId: user.id });

    res.json(successResponse(null, 'If the email exists, a reset link has been sent'));

  } catch (error) {
    next(error);
  }
}

// Reset password
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'password_reset') {
        throw new AppError('Invalid reset token', 400, 'INVALID_TOKEN');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { passwordHash },
      });

      // Revoke all refresh tokens
      await revokeAllRefreshTokens(decoded.userId);

      logger.info('Password reset successful', { userId: decoded.userId });

      res.json(successResponse(null, 'Password reset successful'));

    } catch (jwtError) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

  } catch (error) {
    next(error);
  }
}