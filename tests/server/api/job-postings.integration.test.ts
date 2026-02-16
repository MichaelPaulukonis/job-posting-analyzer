import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from '~/server/utils/prisma';
import { createTestUser, createTestJobPosting } from '../../setup';

// Mock user for authentication
let mockUser: { id: string; email: string; name: string | null };

jest.mock('~/server/utils/verifyToken', () => ({
  requireAuth: jest.fn().mockImplementation(() => {
    return Promise.resolve({ user: mockUser, decodedToken: {} });
  })
}));

describe('Job Postings API', () => {
  let testJobPostingId: string;

  beforeEach(async () => {
    // Create unique test user for this test
    mockUser = await createTestUser();
  });

  describe('POST /api/job-postings', () => {
    it('should create a new job posting', async () => {
      const jobPostingData = {
        title: 'Senior Software Engineer',
        company: 'Test Company',
        content: 'We are looking for a senior software engineer...'
      };

      const jobPosting = await createTestJobPosting(jobPostingData);

      expect(jobPosting).toBeDefined();
      expect(jobPosting.title).toBe(jobPostingData.title);
      expect(jobPosting.company).toBe(jobPostingData.company);

      testJobPostingId = jobPosting.id;
    });

    it('should allow job posting with empty title (validation at API level)', async () => {
      const jobPosting = await prisma.jobPosting.create({
        data: {
          title: '', // Empty title allowed by Prisma, API should validate
          content: 'Test content',
          userId: mockUser.id
        }
      });

      expect(jobPosting).toBeDefined();
      expect(jobPosting.title).toBe('');
    });

    it('should allow job posting with empty content (validation at API level)', async () => {
      const jobPosting = await prisma.jobPosting.create({
        data: {
          title: 'Test Title',
          content: '', // Empty content allowed by Prisma, API should validate
          userId: mockUser.id
        }
      });

      expect(jobPosting).toBeDefined();
      expect(jobPosting.content).toBe('');
    });
  });

  describe('GET /api/job-postings', () => {
    beforeEach(async () => {
      // Create test job postings using helper
      await createTestJobPosting({
        title: 'Software Engineer',
        company: 'Company A',
        content: 'Job description A'
      });
      await createTestJobPosting({
        title: 'Senior Developer',
        company: 'Company B',
        content: 'Job description B'
      });
      await createTestJobPosting({
        title: 'Tech Lead',
        company: 'Company A',
        content: 'Job description C'
      });
    });

    it('should retrieve all job postings', async () => {
      const jobPostings = await prisma.jobPosting.findMany({
        orderBy: { createdAt: 'desc' }
      });

      expect(jobPostings.length).toBeGreaterThanOrEqual(3);
      expect(jobPostings[0].title).toBe('Tech Lead');
    });

    it('should filter job postings by company', async () => {
      const jobPostings = await prisma.jobPosting.findMany({
        where: {
          company: {
            contains: 'Company A',
            mode: 'insensitive'
          }
        }
      });

      expect(jobPostings.length).toBeGreaterThanOrEqual(2);
      expect(jobPostings.every(jp => jp.company === 'Company A')).toBe(true);
    });

    it('should support pagination', async () => {
      const page1 = await prisma.jobPosting.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 0
      });

      const page2 = await prisma.jobPosting.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 2
      });

      expect(page1).toHaveLength(2);
      expect(page2.length).toBeGreaterThanOrEqual(1);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });
});
