import { defineEventHandler, readBody } from 'h3';
import { requireAuth } from '~/server/utils/verifyToken';
import { prisma } from '~/server/utils/prisma';

/**
 * POST /api/job-postings
 * Creates a new job posting for the authenticated user
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event);

  const body = await readBody(event);
  const { title, company, content, url, location, salaryRange, metadata } = body;

  // Validate required fields
  if (!title || typeof title !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title is required and must be a string'
    });
  }

  if (!content || typeof content !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content is required and must be a string'
    });
  }

  // Create job posting
  const jobPosting = await prisma.jobPosting.create({
    data: {
      userId: user?.id || 'anonymous',
      title,
      company: company || null,
      content,
      url: url || null,
      location: location || null,
      salaryRange: salaryRange || null,
      metadata: metadata || {}
    },
    select: {
      id: true,
      userId: true,
      title: true,
      company: true,
      content: true,
      url: true,
      location: true,
      salaryRange: true,
      metadata: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return jobPosting;
});
