import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';

const app = express();
const port = 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        server: 'running'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple auth test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'CodeGuardian AI Backend is running! 🚀',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    config: {
      port: port,
      database: 'connected',
      aws: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'missing',
      github: process.env.GITHUB_CLIENT_ID ? 'configured' : 'missing'
    }
  });
});

const server = app.listen(port, () => {
  console.log(`🚀 CodeGuardian AI Backend server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});