import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from '~/server/utils/prisma';
import { createTestUser, createTestResume, createTestJobPosting, createTestAnalysis } from '../../setup';

// Mock user for authentication
let mockUser: { id: string; email: string; name: string | null };

jest.mock('~/server/utils/verifyToken', () => ({
  requireAuth: jest.fn().mockImplementation(() => {
    return Promise.resolve({ user: mockUser, decodedToken: {} });
  })
}));

describe('Resumes API', () => {
  let testResumeId: string;

  beforeEach(async () => {
    // Create unique test user for this test
    mockUser = await createTestUser();
  });

  describe('POST /api/resumes', () => {
    it('should create a new resume', async () => {
      const resumeData = {
        name: 'Software Engineer Resume',
        content: 'John Doe\nSoftware Engineer with 5 years experience...'
      };

      const resume = await createTestResume(mockUser.id, resumeData);

      expect(resume).toBeDefined();
      expect(resume.name).toBe(resumeData.name);
      expect(resume.content).toBe(resumeData.content);
      expect(resume.userId).toBe(mockUser.id);

      testResumeId = resume.id;
    });

    it('should allow resume with empty name (validation at API level)', async () => {
      const resume = await prisma.resume.create({
        data: {
          name: '', // Empty name allowed by Prisma, API should validate
          content: 'Test content',
          userId: mockUser.id
        }
      });

      expect(resume).toBeDefined();
      expect(resume.name).toBe('');
    });

    it('should allow resume with empty content (validation at API level)', async () => {
      const resume = await prisma.resume.create({
        data: {
          name: 'Test Resume',
          content: '', // Empty content allowed by Prisma, API should validate
          userId: mockUser.id
        }
      });

      expect(resume).toBeDefined();
      expect(resume.content).toBe('');
    });

    it('should create resume with default metadata', async () => {
      const resume = await createTestResume(mockUser.id, {
        name: 'Test Resume',
        content: 'Test content'
      });

      expect(resume.metadata).toEqual({});
    });
  });

  describe('GET /api/resumes', () => {
    beforeEach(async () => {
      // Create test resumes using helper
      await createTestResume(mockUser.id, {
        name: 'Software Engineer Resume',
        content: 'Resume content 1'
      });
      await createTestResume(mockUser.id, {
        name: 'Senior Developer Resume',
        content: 'Resume content 2'
      });
      await createTestResume(mockUser.id, {
        name: 'Tech Lead Resume',
        content: 'Resume content 3'
      });
    });

    it('should retrieve all resumes for user', async () => {
      const resumes = await prisma.resume.findMany({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' }
      });

      expect(resumes).toHaveLength(3);
      expect(resumes[0].name).toBe('Tech Lead Resume');
    });

    it('should filter resumes by name', async () => {
      const resumes = await prisma.resume.findMany({
        where: {
          userId: mockUser.id,
          name: {
            contains: 'Engineer',
            mode: 'insensitive'
          }
        }
      });

      expect(resumes).toHaveLength(1);
      expect(resumes[0].name).toBe('Software Engineer Resume');
    });

    it('should support pagination', async () => {
      const page1 = await prisma.resume.findMany({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 0
      });

      const page2 = await prisma.resume.findMany({
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

  describe('GET /api/resumes/:id', () => {
    beforeEach(async () => {
      const resume = await createTestResume(mockUser.id, {
        name: 'Test Resume',
        content: 'Test content'
      });
      testResumeId = resume.id;
    });

    it('should retrieve resume by ID', async () => {
      const resume = await prisma.resume.findFirst({
        where: {
          id: testResumeId,
          userId: mockUser.id
        }
      });

      expect(resume).toBeDefined();
      expect(resume!.id).toBe(testResumeId);
      expect(resume!.name).toBe('Test Resume');
    });

    it('should return null for non-existent resume', async () => {
      const { randomUUID } = await import('crypto');
      const resume = await prisma.resume.findFirst({
        where: {
          id: randomUUID(),
          userId: mockUser.id
        }
      });

      expect(resume).toBeNull();
    });
  });

  describe('DELETE /api/resumes/:id', () => {
    beforeEach(async () => {
      const resume = await createTestResume(mockUser.id, {
        name: 'Test Resume',
        content: 'Test content'
      });
      testResumeId = resume.id;
    });

    it('should delete resume by ID', async () => {
      await prisma.resume.delete({
        where: { id: testResumeId }
      });

      const resume = await prisma.resume.findUnique({
        where: { id: testResumeId }
      });

      expect(resume).toBeNull();
    });

    it('should cascade delete related data', async () => {
      // Create job posting using helper
      const jobPosting = await createTestJobPosting({
        title: 'Test Job',
        content: 'Test content'
      });

      // Create analysis result using helper
      await createTestAnalysis(testResumeId, jobPosting.id);

      // Delete resume
      await prisma.resume.delete({
        where: { id: testResumeId }
      });

      // Verify analysis was also deleted (cascade)
      const analyses = await prisma.analysisResult.findMany({
        where: { resumeId: testResumeId }
      });

      expect(analyses).toHaveLength(0);
    });
  });
});
