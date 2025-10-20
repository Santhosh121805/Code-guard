import { logger } from '../utils/logger.js';

export function requestLogger(req, res, next) {
  // Generate unique request ID
  req.requestId = Math.random().toString(36).substr(2, 9);
  
  // Start timer
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString(),
  });

  // Log request body for POST/PUT/PATCH (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = sanitizeRequestBody(req.body);
    logger.debug('Request body', {
      requestId: req.requestId,
      body: sanitizedBody,
    });
  }

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString(),
    };

    // Log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else {
      logger.info('Request completed successfully', logData);
    }

    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        ...logData,
        slowRequest: true,
      });
    }
  });

  // Log response errors
  res.on('error', (error) => {
    logger.error('Response error', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });
  });

  next();
}

// Sanitize request body to remove sensitive information
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'auth',
    'credential',
    'passwordHash',
    'githubAccessToken',
  ];

  const sanitized = { ...body };

  // Recursively sanitize nested objects
  function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field is sensitive
      const isSensitive = sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return sanitizeObject(sanitized);
}

// Log user activity for audit purposes
export function auditLogger(action, resource = null) {
  return (req, res, next) => {
    // Log the action after the request completes
    res.on('finish', () => {
      if (res.statusCode < 400) { // Only log successful actions
        const auditData = {
          requestId: req.requestId,
          userId: req.user?.id,
          action,
          resource,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString(),
        };

        // Add resource ID from params if available
        if (req.params.id) {
          auditData.resourceId = req.params.id;
        }

        logger.info('User action audit', auditData);
      }
    });

    next();
  };
}