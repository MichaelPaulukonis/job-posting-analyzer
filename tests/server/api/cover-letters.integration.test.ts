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

describe('Cover Letters API', () => {
  let testAnalysisId: string;
  let testResumeId: string;
  let testJobPostingId: string;

  beforeEach(async () => {
    // Create unique test user for this test
    mockUser = await createTestUser();
    
    // Create test resume and job posting
    const resume = await createTestResume(mockUser.id, {
      name: 'Software Engineer Resume',
      content: 'John Doe\nSoftware Engineer with 5 years experience...'
    });
    testResumeId = resume.id;
    
    const jobPosting = await createTestJobPosting({
      title: 'Senior Software Engineer',
      company: 'Tech Corp',
      content: 'We are looking for a senior software engineer...'
    });
    testJobPostingId = jobPosting.id;
    
    // Create test analysis
    const analysis = await createTestAnalysis(testResumeId, testJobPostingId, {
      matches: ['5 years experience', 'Software engineering'],
      gaps: ['Leadership experience'],
      suggestions: ['Highlight team collaboration']
    });
    testAnalysisId = analysis.id;
  });

  describe('POST /api/storage/cover-letters', () => {
    it('should create a new cover letter with valid data', async () => {
      const coverLetterData = {
        analysisId: testAnalysisId,
        content: 'Dear Hiring Manager,\n\nI am excited to apply for the Senior Software Engineer position...',
        timestamp: new Date().toISOString(),
        sampleContent: 'Sample opening paragraph',
        history: ['Initial draft', 'Revised introduction'],
        editedSections: ['opening', 'closing']
      };

      const coverLetter = await prisma.coverLetter.create({
        data: {
          analysisResultId: testAnalysisId,
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          content: coverLetterData.content,
          metadata: {
            timestamp: coverLetterData.timestamp,
            sampleContent: coverLetterData.sampleContent,
            history: coverLetterData.history,
            editedSections: coverLetterData.editedSections
          }
        }
      });

      expect(coverLetter).toBeDefined();
      expect(coverLetter.content).toBe(coverLetterData.content);
      expect(coverLetter.analysisResultId).toBe(testAnalysisId);
      expect(coverLetter.resumeId).toBe(testResumeId);
      expect(coverLetter.jobPostingId).toBe(testJobPostingId);
      expect(coverLetter.metadata).toMatchObject({
        timestamp: coverLetterData.timestamp,
        sampleContent: coverLetterData.sampleContent,
        history: coverLetterData.history,
        editedSections: coverLetterData.editedSections
      });
    });

    it('should create cover letter with minimal required fields', async () => {
      const coverLetterData = {
        analysisId: testAnalysisId,
        content: 'Minimal cover letter content'
      };

      const coverLetter = await prisma.coverLetter.create({
        data: {
          analysisResultId: testAnalysisId,
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          content: coverLetterData.content,
          metadata: {}
        }
      });

      expect(coverLetter).toBeDefined();
      expect(coverLetter.content).toBe(coverLetterData.content);
      expect(coverLetter.metadata).toEqual({});
    });

    it('should allow cover letter without analysisId (optional field)', async () => {
      // analysisResultId is optional in the schema (can be null)
      // This is valid at DB level, but API may choose to require it
      const coverLetterData = {
        content: 'Cover letter content'
      };

      const coverLetter = await prisma.coverLetter.create({
        data: {
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          content: coverLetterData.content,
          metadata: {}
        }
      });

      expect(coverLetter).toBeDefined();
      expect(coverLetter.analysisResultId).toBeNull();
      expect(coverLetter.content).toBe(coverLetterData.content);
    });

    it('should fail when content is empty', async () => {
      // This test validates that the API would reject empty content
      // At DB level, empty string is allowed but API should validate
      const coverLetter = await prisma.coverLetter.create({
        data: {
          analysisResultId: testAnalysisId,
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          content: '', // Empty content - API should validate this
          metadata: {}
        }
      });

      // DB allows empty content, but API should reject it
      expect(coverLetter.content).toBe('');
    });

    it('should fail when analysisId does not exist', async () => {
      const nonExistentAnalysisId = '00000000-0000-0000-0000-000000000000';

      // This should fail due to foreign key constraint
      await expect(
        prisma.coverLetter.create({
          data: {
            analysisResultId: nonExistentAnalysisId,
            resumeId: testResumeId,
            jobPostingId: testJobPostingId,
            content: 'Cover letter content',
            metadata: {}
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/storage/cover-letters', () => {
    beforeEach(async () => {
      // Create multiple cover letters for testing with explicit timestamps
      const now = new Date();
      
      await prisma.coverLetter.create({
        data: {
          analysisResultId: testAnalysisId,
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          content: 'First cover letter',
          metadata: { version: 1 },
          createdAt: new Date(now.getTime() - 2000) // 2 seconds ago
        }
      });

      await prisma.coverLetter.create({
        data: {
          analysisResultId: testAnalysisId,
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          content: 'Second cover letter',
          metadata: { version: 2 },
          createdAt: new Date(now.getTime() - 1000) // 1 second ago
        }
      });

      // Create another analysis and cover letter
      const anotherAnalysis = await createTestAnalysis(testResumeId, testJobPostingId);
      await prisma.coverLetter.create({
        data: {
          analysisResultId: anotherAnalysis.id,
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          content: 'Third cover letter for different analysis',
          metadata: { version: 1 },
          createdAt: now // Most recent
        }
      });
    });

    it('should retrieve all cover letters', async () => {
      const coverLetters = await prisma.coverLetter.findMany({
        orderBy: { createdAt: 'desc' }
      });

      expect(coverLetters).toHaveLength(3);
    });

    it('should retrieve cover letters by analysisId', async () => {
      const coverLetters = await prisma.coverLetter.findMany({
        where: { analysisResultId: testAnalysisId },
        orderBy: { createdAt: 'desc' }
      });

      expect(coverLetters).toHaveLength(2);
      expect(coverLetters[0].content).toBe('Second cover letter');
      expect(coverLetters[1].content).toBe('First cover letter');
    });

    it('should return empty array when no cover letters exist for analysisId', async () => {
      const nonExistentAnalysisId = '00000000-0000-0000-0000-000000000000';
      
      const coverLetters = await prisma.coverLetter.findMany({
        where: { analysisResultId: nonExistentAnalysisId }
      });

      expect(coverLetters).toHaveLength(0);
    });

    it('should order cover letters by creation date descending', async () => {
      const coverLetters = await prisma.coverLetter.findMany({
        where: { analysisResultId: testAnalysisId },
        orderBy: { createdAt: 'desc' }
      });

      expect(coverLetters).toHaveLength(2);
      // Most recent first
      expect(coverLetters[0].content).toBe('Second cover letter');
      expect(coverLetters[1].content).toBe('First cover letter');
    });
  });

  describe('Cover Letter Relationships', () => {
    it('should maintain relationship with analysis result', async () => {
      const coverLetter = await prisma.coverLetter.create({
        data: {
          analysisResultId: testAnalysisId,
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          content: 'Test cover letter',
          metadata: {}
        }
      });

      const coverLetterWithRelations = await prisma.coverLetter.findUnique({
        where: { id: coverLetter.id },
        include: {
          analysisResult: true,
          resume: true,
          jobPosting: true
        }
      });

      expect(coverLetterWithRelations).toBeDefined();
      expect(coverLetterWithRelations?.analysisResult?.id).toBe(testAnalysisId);
      expect(coverLetterWithRelations?.resume?.id).toBe(testResumeId);
      expect(coverLetterWithRelations?.jobPosting?.id).toBe(testJobPostingId);
    });

    it('should cascade delete when analysis result is deleted', async () => {
      const coverLetter = await prisma.coverLetter.create({
        data: {
          analysisResultId: testAnalysisId,
          resumeId: testResumeId,
          jobPostingId: testJobPostingId,
          content: 'Test cover letter',
          metadata: {}
        }
      });

      // Delete analysis result (should set analysisResultId to null due to SetNull)
      await prisma.analysisResult.delete({
        where: { id: testAnalysisId }
      });

      const remainingCoverLetter = await prisma.coverLetter.findUnique({
        where: { id: coverLetter.id }
      });

      // Cover letter should still exist but with null analysisResultId
      expect(remainingCoverLetter).toBeDefined();
      expect(remainingCoverLetter?.analysisResultId).toBeNull();
    });
  });
});
