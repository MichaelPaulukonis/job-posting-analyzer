import { defineEventHandler, readBody } from 'h3';
import { requireAuth } from '~/server/utils/verifyToken';
import { prisma } from '~/server/utils/prisma';

/**
 * POST /api/resumes
 * Creates a new resume for the authenticated user
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event);

  const body = await readBody(event);
  const { name, content, metadata } = body;

  // Validate required fields
  if (!name || typeof name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required and must be a string'
    });
  }

  if (!content || typeof content !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content is required and must be a string'
    });
  }

  // Create resume
  // Use a default userId if auth is disabled
  const resume = await prisma.resume.create({
    data: {
      userId: user?.id || 'anonymous',
      name,
      content,
      metadata: metadata || {}
    },
    select: {
      id: true,
      userId: true,
      name: true,
      content: true,
      metadata: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return resume;
});
