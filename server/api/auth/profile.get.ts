import { defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/verifyToken';

/**
 * GET /api/auth/profile
 * Returns the current authenticated user's profile from the database
 */
export default defineEventHandler(async (event) => {
  const { user, decodedToken } = await requireAuth(event);

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required for profile access'
    });
  }

  return {
    user: {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    firebase: {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    }
  };
});
