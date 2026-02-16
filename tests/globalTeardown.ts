import { execSync } from 'child_process';

/**
 * Global teardown for integration tests
 * Runs once after all test suites complete
 */
export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test environment...\n');

  try {
    // Stop and remove Docker PostgreSQL container
    console.log('🐳 Stopping Docker PostgreSQL container...');
    execSync('docker-compose -f docker-compose.test.yml down', {
      stdio: 'inherit'
    });

    console.log('✅ Test environment cleanup complete\n');
  } catch (error) {
    console.error('❌ Test environment cleanup failed:', error);
    // Don't throw - we want tests to report their results even if cleanup fails
  }
}
