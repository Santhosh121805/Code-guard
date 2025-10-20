import express from 'express';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  getProfile, 
  updateProfile,
  changePassword,
  githubCallback,
  initiateGitHubAuth,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { 
  validateUserRegistration, 
  validateUserLogin, 
  validateUserUpdate,
  validatePassword,
  validateEmail
} from '../middleware/validation.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { auditLogger } from '../middleware/requestLogger.js';

const router = express.Router();

// Public routes (with auth rate limiting)
router.post('/register', 
  authRateLimiter,
  validateUserRegistration,
  auditLogger('USER_REGISTER'),
  register
);

router.post('/login', 
  authRateLimiter,
  validateUserLogin,
  auditLogger('USER_LOGIN'),
  login
);

router.post('/refresh-token', 
  authRateLimiter,
  refreshToken
);

router.post('/forgot-password',
  authRateLimiter,
  validateEmail,
  auditLogger('PASSWORD_FORGOT'),
  forgotPassword
);

router.post('/reset-password',
  authRateLimiter,
  validatePassword,
  auditLogger('PASSWORD_RESET'),
  resetPassword
);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification',
  authRateLimiter,
  validateEmail,
  resendVerification
);

// GitHub OAuth routes
router.get('/github',
  auditLogger('GITHUB_AUTH_INITIATE'),
  initiateGitHubAuth
);

router.get('/github/callback',
  authRateLimiter,
  auditLogger('GITHUB_AUTH_CALLBACK'),
  githubCallback
);

// Protected routes
router.post('/logout',
  authenticate,
  auditLogger('USER_LOGOUT'),
  logout
);

router.get('/me',
  authenticate,
  getProfile
);

router.put('/profile',
  authenticate,
  validateUserUpdate,
  auditLogger('PROFILE_UPDATE'),
  updateProfile
);

router.put('/change-password',
  authenticate,
  validatePassword,
  auditLogger('PASSWORD_CHANGE'),
  changePassword
);

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    service: 'auth',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;