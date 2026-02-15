import { defineEventHandler, readBody } from 'h3';
import { requireAuth } from '~/server/utils/verifyToken';
import { prisma } from '~/server/utils/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * POST /api/analysis
 * Creates a new analysis result comparing a resume to a job posting
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event);

  const body = await readBody(event);
  const { resumeId, jobPostingId, matches, gaps, suggestions, similarityScore, analysisMetadata } = body;

  // Validate required fields
  if (!resumeId || typeof resumeId !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'resumeId is required and must be a string'
    });
  }

  if (!jobPostingId || typeof jobPostingId !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'jobPostingId is required and must be a string'
    });
  }

  // Verify resume belongs to user (skip check if auth is disabled)
  const resumeWhere: any = { id: resumeId };
  if (user?.id) {
    resumeWhere.userId = user.id;
  }
  
  const resume = await prisma.resume.findFirst({
    where: resumeWhere
  });

  if (!resume) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Resume not found or does not belong to user'
    });
  }

  // Verify job posting belongs to user (skip check if auth is disabled)
  const jobPostingWhere: any = { id: jobPostingId };
  if (user?.id) {
    jobPostingWhere.userId = user.id;
  }
  
  const jobPosting = await prisma.jobPosting.findFirst({
    where: jobPostingWhere
  });

  if (!jobPosting) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Job posting not found or does not belong to user'
    });
  }

  // Create analysis result
  const analysisResult = await prisma.analysisResult.create({
    data: {
      resumeId,
      jobPostingId,
      matches: Array.isArray(matches) ? matches : [],
      gaps: Array.isArray(gaps) ? gaps : [],
      suggestions: Array.isArray(suggestions) ? suggestions : [],
      similarityScore: similarityScore ? new Decimal(similarityScore) : null,
      analysisMetadata: analysisMetadata || {}
    },
    select: {
      id: true,
      resumeId: true,
      jobPostingId: true,
      matches: true,
      gaps: true,
      suggestions: true,
      similarityScore: true,
      analysisMetadata: true,
      createdAt: true,
      updatedAt: true,
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

  return analysisResult;
});
