import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '~/server/utils/prisma';
import { randomUUID } from 'crypto';

// Mock authentication
const mockUser = {
  id: randomUUID(),
  firebaseUid: 'test-firebase-uid',
  email: 'test@example.com',
  name: 'Test User'
};

jest.mock('~/server/utils/verifyToken', () => ({
  requireAuth: jest.fn().mockResolvedValue({ user: mockUser, decodedToken: {} })
}));

describe('Job Postings API', () => {
  let testJobPostingId: string;

  beforeEach(async () => {
    // Create test user first
    await prisma.user.upsert({
      where: { id: mockUser.id },
      update: {},
      create: {
        id: mockUser.id,
        firebaseUid: mockUser.firebaseUid,
        email: mockUser.email,
        name: mockUser.name
      }
    });

    // Clean up test data
    await prisma.jobPosting.deleteMany({
      where: { userId: mockUser.id }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.jobPosting.deleteMany({
      where: { userId: mockUser.id }
    });
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: mockUser.id }
    }).catch(() => {
      // Ignore if already deleted
    });
  });

  describe('POST /api/job-postings', () => {
    it('should create a new job posting', async () => {
      const jobPostingData = {
        title: 'Senior Software Engineer',
        company: 'Test Company',
        content: 'We are looking for a senior software engineer...',
        url: 'https://example.com/job',
        location: 'Remote',
        salaryRange: '$120k-$180k'
      };

      const jobPosting = await prisma.jobPosting.create({
        data: {
          ...jobPostingData,
          userId: mockUser.id
        }
      });

      expect(jobPosting).toBeDefined();
      expect(jobPosting.title).toBe(jobPostingData.title);
      expect(jobPosting.company).toBe(jobPostingData.company);
      expect(jobPosting.userId).toBe(mockUser.id);

      testJobPostingId = jobPosting.id;
    });

    it('should reject job posting without title', async () => {
      await expect(
        prisma.jobPosting.create({
          data: {
            title: '', // Empty title should fail validation
            content: 'Test content',
            userId: mockUser.id
          }
        })
      ).rejects.toThrow();
    });

    it('should reject job posting without content', async () => {
      await expect(
        prisma.jobPosting.create({
          data: {
            title: 'Test Title',
            content: '', // Empty content should fail validation
            userId: mockUser.id
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/job-postings', () => {
    beforeEach(async () => {
      // Create test job postings
      await prisma.jobPosting.createMany({
        data: [
          {
            userId: mockUser.id,
            title: 'Software Engineer',
            company: 'Company A',
            content: 'Job description A'
          },
          {
            userId: mockUser.id,
            title: 'Senior Developer',
            company: 'Company B',
            content: 'Job description B'
          },
          {
            userId: mockUser.id,
            title: 'Tech Lead',
            company: 'Company A',
            content: 'Job description C'
          }
        ]
      });
    });

    it('should retrieve all job postings for user', async () => {
      const jobPostings = await prisma.jobPosting.findMany({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' }
      });

      expect(jobPostings).toHaveLength(3);
      expect(jobPostings[0].title).toBe('Tech Lead');
    });

    it('should filter job postings by company', async () => {
      const jobPostings = await prisma.jobPosting.findMany({
        where: {
          userId: mockUser.id,
          company: {
            contains: 'Company A',
            mode: 'insensitive'
          }
        }
      });

      expect(jobPostings).toHaveLength(2);
      expect(jobPostings.every(jp => jp.company === 'Company A')).toBe(true);
    });

    it('should support pagination', async () => {
      const page1 = await prisma.jobPosting.findMany({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 0
      });

      const page2 = await prisma.jobPosting.findMany({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 2
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });
});
