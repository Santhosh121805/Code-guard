import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler.js';

// Handle validation errors
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    throw new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      errorDetails
    );
  }
  
  next();
}

// User validation rules
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  handleValidationErrors,
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

export const validateUserUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be a valid object'),
  handleValidationErrors,
];

// Repository validation rules
export const validateRepositoryConnection = [
  body('githubRepoId')
    .isNumeric()
    .withMessage('GitHub repository ID must be a number'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Repository name is required and must be less than 100 characters'),
  body('fullName')
    .matches(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/)
    .withMessage('Repository full name must be in format owner/repo'),
  body('owner')
    .isLength({ min: 1, max: 50 })
    .withMessage('Repository owner is required'),
  body('defaultBranch')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Default branch name must be less than 50 characters'),
  body('private')
    .optional()
    .isBoolean()
    .withMessage('Private must be a boolean value'),
  body('language')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Language must be less than 50 characters'),
  handleValidationErrors,
];

export const validateRepositorySettings = [
  body('autoScanEnabled')
    .optional()
    .isBoolean()
    .withMessage('Auto scan enabled must be a boolean'),
  body('autoFixEnabled')
    .optional()
    .isBoolean()
    .withMessage('Auto fix enabled must be a boolean'),
  handleValidationErrors,
];

// Vulnerability validation rules
export const validateVulnerabilityStatus = [
  body('status')
    .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'IGNORED'])
    .withMessage('Invalid vulnerability status'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  handleValidationErrors,
];

// Scan validation rules
export const validateScanTrigger = [
  body('repositoryIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Repository IDs must be a non-empty array'),
  body('repositoryIds.*')
    .optional()
    .isUUID()
    .withMessage('Each repository ID must be a valid UUID'),
  body('branch')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Branch name must be between 1 and 100 characters'),
  handleValidationErrors,
];

// AI chat validation rules
export const validateAIChat = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be a valid object'),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

// ID parameter validation
export const validateId = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
  handleValidationErrors,
];

// Filter validation for vulnerabilities
export const validateVulnerabilityFilters = [
  query('severity')
    .optional()
    .isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
    .withMessage('Invalid severity filter'),
  query('status')
    .optional()
    .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'IGNORED'])
    .withMessage('Invalid status filter'),
  query('repositoryId')
    .optional()
    .isUUID()
    .withMessage('Repository ID must be a valid UUID'),
  query('type')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Type filter must be less than 100 characters'),
  handleValidationErrors,
];

// Webhook validation
export const validateGitHubWebhook = [
  body('action')
    .optional()
    .isString()
    .withMessage('Action must be a string'),
  body('repository')
    .isObject()
    .withMessage('Repository data is required'),
  body('repository.id')
    .isNumeric()
    .withMessage('Repository ID must be numeric'),
  body('commits')
    .optional()
    .isArray()
    .withMessage('Commits must be an array'),
  handleValidationErrors,
];

// Email validation
export const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors,
];

// Password validation
export const validatePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors,
];

// Notification settings validation
export const validateNotificationSettings = [
  body('email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications setting must be a boolean'),
  body('push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications setting must be a boolean'),
  body('criticalOnly')
    .optional()
    .isBoolean()
    .withMessage('Critical only setting must be a boolean'),
  handleValidationErrors,
];

// Additional validations for missing exports
export const validateRepository = validateRepositoryConnection;
export const validateVulnerability = [
  body('content').notEmpty().withMessage('Comment content is required'),
  handleValidationErrors,
];