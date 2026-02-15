import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '~/server/utils/prisma';
import { Decimal } from '@prisma/client/runtime/library';
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

describe('Analysis API', () => {
  let testResumeId: string;
  let testJobPostingId: string;
  let testAnalysisId: string;

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
    await prisma.analysisResult.deleteMany({
      where: { resume: { userId: mockUser.id } }
    });
    await prisma.resume.deleteMany({
      where: { userId: mockUser.id }
    });
    await prisma.jobPosting.deleteMany({
      where: { userId: mockUser.id }
    });

    // Create test resume
    const resume = await prisma.resume.create({
      data: {
        userId: mockUser.id,
        name: 'Test Resume',
        content: 'Test resume content with JavaScript and React skills'
      }
    });
    testResumeId = resume.id;

    // Create test job posting
    const jobPosting = await prisma.jobPosting.create({
      data: {
        userId: mockUser.id,
        title: 'Software Engineer',
        company: 'Test Company',
        content: 'Looking for JavaScript and React developer'
      }
    });
    testJobPostingId = jobPosting.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.analysisResult.deleteMany({
      where: { resume: { userId: mockUser.id } }
    });
    await prisma.resume.deleteMany({
      where: { userId: mockUser.id }
    });
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

  describe('POST /api/analysis', () => {
    it('should create a new analysis result', async () => {
      const analysisData = {
        resumeId: testResumeId,
        jobPostingId: testJobPostingId,
        matches: ['JavaScript', 'React'],
        gaps: ['Python', 'Docker'],
        suggestions: ['Add Python experience', 'Learn Docker'],
        similarityScore: new Decimal('0.8500')
      };

      const analysis = await prisma.analysisResult.create({
        data: analysisData,
        include: {
          resume: {
            select: {
              id: true,
              name: true
            }
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
              company: true
            }
          }
        }
      });

      expect(analysis).toBeDefined();
      expect(analysis.matches).toEqual(analysisData.matches);
      expect(analysis.gaps).toEqual(analysisData.gaps);
      expect(analysis.suggestions).toEqual(analysisData.suggestions);
      expect(analysis.resume.name).toBe('Test Resume');
      expect(analysis.jobPosting.title).toBe('Software Engineer');

      testAnalysisId = analysis.id;
    });

    it('should reject analysis with invalid resumeId', async () => {
      await expect(
        prisma.analysisResult.create({
          data: {
            resumeId: 'invalid-resume-id',
            jobPostingId: testJobPostingId,
            matches: [],
            gaps: [],
            suggestions: []
          }
        })
      ).rejects.toThrow();
    });

    it('should reject analysis with invalid jobPostingId', async () => {
      await expect(
        prisma.analysisResult.create({
          data: {
            resumeId: testResumeId,
            jobPostingId: 'invalid-job-posting-id',
            matches: [],
            gaps: [],
            suggestions: []
          }
        })
      ).rejects.toThrow();
    });

    it('should store analysis metadata', async () => {
      const metadata = {
        aiModel: 'gemini-pro',
        processingTime: 1500,
        version: '1.0'
      };

      const analysis = await prisma.analysisResult.create({
        data: {
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          matches: ['JavaScript'],
          gaps: [],
          suggestions: [],
          analysisMetadata: metadata
        }
      });

      expect(analysis.analysisMetadata).toEqual(metadata);
    });
  });

  describe('GET /api/analysis/:id', () => {
    beforeEach(async () => {
      // Create test analysis
      const analysis = await prisma.analysisResult.create({
        data: {
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          matches: ['JavaScript', 'React'],
          gaps: ['Python'],
          suggestions: ['Learn Python'],
          similarityScore: new Decimal('0.7500')
        }
      });
      testAnalysisId = analysis.id;
    });

    it('should retrieve analysis by ID with full details', async () => {
      const analysis = await prisma.analysisResult.findFirst({
        where: {
          id: testAnalysisId,
          resume: { userId: mockUser.id }
        },
        include: {
          resume: {
            select: {
              id: true,
              name: true,
              content: true,
              metadata: true,
              createdAt: true
            }
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
              company: true,
              content: true,
              url: true,
              location: true,
              salaryRange: true,
              metadata: true,
              createdAt: true
            }
          }
        }
      });

      expect(analysis).toBeDefined();
      expect(analysis!.id).toBe(testAnalysisId);
      expect(analysis!.matches).toEqual(['JavaScript', 'React']);
      expect(analysis!.resume.name).toBe('Test Resume');
      expect(analysis!.jobPosting.title).toBe('Software Engineer');
    });

    it('should return null for non-existent analysis', async () => {
      const analysis = await prisma.analysisResult.findFirst({
        where: {
          id: 'non-existent-id',
          resume: { userId: mockUser.id }
        }
      });

      expect(analysis).toBeNull();
    });
  });

  describe('GET /api/analysis', () => {
    beforeEach(async () => {
      // Create multiple test analyses
      await prisma.analysisResult.createMany({
        data: [
          {
            resumeId: testResumeId,
            jobPostingId: testJobPostingId,
            matches: ['JavaScript'],
            gaps: [],
            suggestions: []
          },
          {
            resumeId: testResumeId,
            jobPostingId: testJobPostingId,
            matches: ['React'],
            gaps: [],
            suggestions: []
          },
          {
            resumeId: testResumeId,
            jobPostingId: testJobPostingId,
            matches: ['TypeScript'],
            gaps: [],
            suggestions: []
          }
        ]
      });
    });

    it('should retrieve all analyses for user', async () => {
      const analyses = await prisma.analysisResult.findMany({
        where: {
          resume: { userId: mockUser.id }
        },
        orderBy: { createdAt: 'desc' }
      });

      expect(analyses).toHaveLength(3);
    });

    it('should filter analyses by resumeId', async () => {
      const analyses = await prisma.analysisResult.findMany({
        where: {
          resumeId: testResumeId,
          resume: { userId: mockUser.id }
        }
      });

      expect(analyses).toHaveLength(3);
      expect(analyses.every(a => a.resumeId === testResumeId)).toBe(true);
    });

    it('should filter analyses by jobPostingId', async () => {
      const analyses = await prisma.analysisResult.findMany({
        where: {
          jobPostingId: testJobPostingId,
          resume: { userId: mockUser.id }
        }
      });

      expect(analyses).toHaveLength(3);
      expect(analyses.every(a => a.jobPostingId === testJobPostingId)).toBe(true);
    });

    it('should support pagination', async () => {
      const page1 = await prisma.analysisResult.findMany({
        where: {
          resume: { userId: mockUser.id }
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 0
      });

      const page2 = await prisma.analysisResult.findMany({
        where: {
          resume: { userId: mockUser.id }
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 2
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });
  });
});
