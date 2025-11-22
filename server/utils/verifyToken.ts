import { createError, useRuntimeConfig } from '#imports';
import type { H3Event } from 'h3';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { verifyIdToken } from '~/server/utils/firebaseAdmin';

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
}

// This is a handler that can be used within server APIs to verify tokens.
export const requireAuth = async (
  event: H3Event,
  options: RequireAuthOptions = {}
): Promise<DecodedIdToken | null> => {
  const config = useRuntimeConfig();
  if (config.public?.authDisabled) {
    return null;
  }

  const token = options.token ?? getAuthTokenFromHeader(event);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing authorization token' });
  }

  try {
    const decoded = await verifyIdToken(token);
    (event.context as Record<string, unknown>).auth = decoded;
    return decoded;
  } catch (error: unknown) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired authorization token',
      cause: error
    });
  }
};

export default requireAuth;
