import { execSync } from 'child_process';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

/**
 * Global setup for integration tests
 * Runs once before all test suites
 */
export default async function globalSetup() {
  console.log('\n🚀 Starting test environment setup...\n');

  // Load test environment variables - FORCE override any existing env vars
  const testEnv = config({ path: '.env.test', override: true });
  
  if (!testEnv.parsed) {
    throw new Error('Failed to load .env.test file');
  }

  // Explicitly set DATABASE_URL to ensure it's used
  process.env.DATABASE_URL = testEnv.parsed.DATABASE_URL;

  // CRITICAL SAFETY CHECK: Ensure we're using test database
  const DATABASE_URL = process.env.DATABASE_URL || '';
  if (!DATABASE_URL.includes('localhost:5433') && !DATABASE_URL.includes('jobanalyzer_test')) {
    throw new Error(
      `❌ SAFETY CHECK FAILED: Tests must use test database!\n` +
      `Current DATABASE_URL: ${DATABASE_URL}\n` +
      `Expected: localhost:5433 or jobanalyzer_test database\n` +
      `This prevents accidental data loss in production database.`
    );
  }

  console.log(`✅ Safety check passed: Using test database at ${DATABASE_URL.split('@')[1]}\n`);

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

    // Run migrations or push schema
    console.log('🔄 Setting up database schema...');
    try {
      // For a fresh test database, use db push to create schema
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
        stdio: 'inherit'
      });
    } catch (error) {
      console.error('❌ Failed to set up database schema');
      throw error;
    }

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
