import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// Create a global Prisma instance to avoid connection issues
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Disconnecting Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Disconnecting Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

// Test database connection on startup
prisma.$connect()
  .then(() => {
    logger.info('📄 Database connected successfully');
  })
  .catch((error) => {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  });