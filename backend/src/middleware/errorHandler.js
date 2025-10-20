import { logger } from '../utils/logger.js';
import { errorResponse } from '../utils/helpers.js';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export function errorHandler(error, req, res, next) {
  let { statusCode = 500, message, code = 'INTERNAL_ERROR', details } = error;

  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    statusCode,
    code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid input data';
    details = error.details;
  }

  if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication failed';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Access token has expired';
  }

  if (error.code === 'P2002') { // Prisma unique constraint violation
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
  }

  if (error.code === 'P2025') { // Prisma record not found
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
    details = null;
  }

  // Send error response
  res.status(statusCode).json(errorResponse(message, code, details));
}

// Not found handler
export function notFoundHandler(req, res) {
  res.status(404).json(errorResponse(
    `Route ${req.originalUrl} not found`,
    'NOT_FOUND'
  ));
}

// Async error wrapper
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}