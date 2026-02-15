import { defineEventHandler, readBody } from 'h3';
import { requireAuth } from '~/server/utils/verifyToken';
import { prisma } from '~/server/utils/prisma';

/**
 * POST /api/auth/profile
 * Updates the current authenticated user's profile
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event);

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required for profile updates'
    });
  }

  const body = await readBody(event);
  const { name } = body;

  // Validate input
  if (!name || typeof name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required and must be a string'
    });
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { name },
    select: {
      id: true,
      firebaseUid: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return {
    user: updatedUser
  };
});
