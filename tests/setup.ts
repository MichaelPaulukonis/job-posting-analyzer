import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import { prisma } from '../server/utils/prisma';

// Load test environment variables
config({ path: '.env.test' });

// CRITICAL SAFETY CHECK: Ensure we're connected to test database
const DATABASE_URL = process.env.DATABASE_URL || '';
if (!DATABASE_URL.includes('localhost:5433') && !DATABASE_URL.includes('jobanalyzer_test')) {
  throw new Error(
    `❌ SAFETY CHECK FAILED: Tests must use test database!\n` +
    `Current DATABASE_URL: ${DATABASE_URL}\n` +
    `Expected: localhost:5433 or jobanalyzer_test database\n` +
    `This prevents accidental data loss in production database.`
  );
}

/**
 * Setup runs before each test file
 */
beforeAll(async () => {
  // Database is already set up by globalSetup
  // This just ensures connection is ready
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('❌ Database connection failed in test setup:', error);
    throw error;
  }
});

/**
 * Cleanup runs after each test file
 */
afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

/**
 * Clean up data after each test to ensure isolation
 */
afterEach(async () => {
  await cleanupTestData();
});

/**
 * Test isolation - clean up data between tests
 * This ensures each test starts with a clean slate
 */
export async function cleanupTestData() {
  // Delete in order to respect foreign key constraints
  await prisma.analysisResult.deleteMany({});
  await prisma.coverLetter.deleteMany({});
  await prisma.jobPosting.deleteMany({});
  await prisma.resume.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Helper to create a test user
 * Returns the created user for use in tests
 */
export async function createTestUser(userData?: {
  id?: string;
  email?: string;
  name?: string;
  firebaseUid?: string;
}) {
  const timestamp = Date.now();
  
  const defaultUser = {
    id: userData?.id || randomUUID(),
    email: userData?.email || `test-${timestamp}@example.com`,
    name: userData?.name || 'Test User',
    firebaseUid: userData?.firebaseUid || randomUUID(),
  };

  return await prisma.user.create({
    data: {
      id: defaultUser.id,
      email: defaultUser.email,
      name: defaultUser.name,
      firebaseUid: defaultUser.firebaseUid,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

/**
 * Helper to create a test resume
 */
export async function createTestResume(userId: string, data?: {
  name?: string;
  content?: string;
}) {
  return await prisma.resume.create({
    data: {
      userId,
      name: data?.name || 'Test Resume',
      content: data?.content || 'Test resume content',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

/**
 * Helper to create a test job posting
 */
export async function createTestJobPosting(data?: {
  title?: string;
  company?: string;
  content?: string;
}) {
  return await prisma.jobPosting.create({
    data: {
      title: data?.title || 'Test Job',
      company: data?.company || 'Test Company',
      content: data?.content || 'Test job posting content',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

/**
 * Helper to create a test analysis
 */
export async function createTestAnalysis(resumeId: string, jobPostingId: string, data?: {
  matches?: any[];
  gaps?: any[];
  suggestions?: any[];
}) {
  return await prisma.analysisResult.create({
    data: {
      resumeId,
      jobPostingId,
      matches: data?.matches || [],
      gaps: data?.gaps || [],
      suggestions: data?.suggestions || [],
      analysisMetadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}
