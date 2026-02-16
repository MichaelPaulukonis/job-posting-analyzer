import { execSync } from 'child_process';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

/**
 * Global setup for integration tests
 * Runs once before all test suites
 */
export default async function globalSetup() {
  console.log('\n🚀 Starting test environment setup...\n');

  // Load test environment variables
  config({ path: '.env.test' });

  try {
    // Start Docker PostgreSQL
    console.log('🐳 Starting Docker PostgreSQL container...');
    execSync('docker-compose -f docker-compose.test.yml up -d', {
      stdio: 'inherit'
    });

    // Wait for database to be ready
    console.log('⏳ Waiting for database to be ready...');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    let retries = 30;
    while (retries > 0) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database is ready');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error('Database failed to start after 30 seconds');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    await prisma.$disconnect();

    // Run migrations
    console.log('🔄 Running database migrations...');
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit'
    });

    console.log('✅ Test environment setup complete\n');
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    // Clean up on failure
    try {
      execSync('docker-compose -f docker-compose.test.yml down', {
        stdio: 'inherit'
      });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}
