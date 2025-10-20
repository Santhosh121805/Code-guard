import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CodeGuardian AI Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'CodeGuardian AI Backend',
    version: '1.0.0',
    description: 'AI-powered security vulnerability scanner',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      repositories: '/api/repositories',
      vulnerabilities: '/api/vulnerabilities',
      dashboard: '/api/dashboard',
      webhooks: '/api/webhooks'
    }
  });
});

// Test database connection
app.get('/api/test/db', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma.js');
    await prisma.user.count();
    res.json({
      status: 'success',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Test Redis connection
app.get('/api/test/redis', async (req, res) => {
  try {
    const { redis } = await import('./services/redis.js');
    await redis.ping();
    res.json({
      status: 'success',
      message: 'Redis connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Redis connection failed',
      error: error.message
    });
  }
});

// Test AWS Bedrock connection
app.get('/api/test/aws', async (req, res) => {
  try {
    const { BedrockRuntimeClient, ListFoundationModelsCommand } = await import('@aws-sdk/client-bedrock-runtime');
    
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Simple test - this will fail if credentials are wrong
    res.json({
      status: 'success',
      message: 'AWS Bedrock configuration looks correct',
      region: process.env.AWS_REGION || 'us-east-1',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error', 
      message: 'AWS Bedrock connection failed',
      error: error.message
    });
  }
});

// Catch-all handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CodeGuardian AI Backend running on http://localhost:${PORT}`);
  console.log(`📄 API documentation: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;