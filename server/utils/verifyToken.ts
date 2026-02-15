import { createError, useRuntimeConfig } from '#imports';
import type { H3Event } from 'h3';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { User } from '@prisma/client';
import { verifyIdToken } from '~/server/utils/firebaseAdmin';
import { authService } from '~/server/services/AuthService';

export const getAuthTokenFromHeader = (event: H3Event): string | null => {
  const authHeader = event.node.req.headers['authorization'];
  if (typeof authHeader !== 'string') {
    return null;
  }

  if (authHeader.startsWith('Bearer ')) {
    const withoutPrefix = authHeader.slice(7).trim();
    return withoutPrefix.length > 0 ? withoutPrefix : null;
  }

  const trimmed = authHeader.trim();
  return trimmed.length > 0 ? trimmed : null;
};

interface RequireAuthOptions {
  token?: string | null;
  syncUser?: boolean; // Whether to sync user to database
}

interface AuthContext {
  decodedToken: DecodedIdToken;
  user?: User;
}

// This is a handler that can be used within server APIs to verify tokens.
export const requireAuth = async (
  event: H3Event,
  options: RequireAuthOptions = { syncUser: true }
): Promise<AuthContext> => {
  const config = useRuntimeConfig();
  if (config.public?.authDisabled) {
    return { decodedToken: {} as DecodedIdToken };
  }

  const token = options.token ?? getAuthTokenFromHeader(event);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing authorization token' });
  }

  try {
    const decodedToken = await verifyIdToken(token);
    
    // Store decoded token in context
    (event.context as Record<string, unknown>).auth = decodedToken;

    // Sync user to database if requested (default: true)
    let user: User | undefined;
    if (options.syncUser !== false) {
      user = await authService.syncUser(decodedToken);
      (event.context as Record<string, unknown>).user = user;
    }

    return { decodedToken, user };
  } catch (error: unknown) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired authorization token',
      cause: error
    });
  }
};

export default requireAuth;
