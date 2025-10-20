import { logger } from '../utils/logger.js';

// Standard API response format
export function successResponse(data = null, message = 'Success', pagination = null) {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
}

// Error response format
export function errorResponse(message = 'An error occurred', code = 'INTERNAL_ERROR', details = null) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

// Pagination helper
export function getPagination(page = 1, limit = 20) {
  const pageNumber = Math.max(1, parseInt(page, 10));
  const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 items per page
  const skip = (pageNumber - 1) * limitNumber;

  return {
    skip,
    take: limitNumber,
    page: pageNumber,
    limit: limitNumber,
  };
}

// Format pagination metadata
export function formatPagination(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// Async wrapper to catch errors in route handlers
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Generate random string
export function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Sanitize user input
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

// Calculate security score based on vulnerabilities
export function calculateSecurityScore(vulnerabilities) {
  if (!vulnerabilities || vulnerabilities.length === 0) {
    return 100; // Perfect score if no vulnerabilities
  }

  let score = 100;
  
  vulnerabilities.forEach(vuln => {
    switch (vuln.severity) {
      case 'CRITICAL':
        score -= 25;
        break;
      case 'HIGH':
        score -= 15;
        break;
      case 'MEDIUM':
        score -= 8;
        break;
      case 'LOW':
        score -= 3;
        break;
    }
  });

  return Math.max(0, Math.min(100, score)); // Ensure score is between 0-100
}

// Format date for human readability
export function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

// Validate environment variables
export function validateRequiredEnvVars(requiredVars) {
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

// Sleep utility for delays
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry utility for operations that might fail
export async function retry(operation, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }
}