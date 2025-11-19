import { defineEventHandler, readBody, createError } from '#imports';
import { verifyIdToken } from '~/server/utils/firebaseAdmin';

// This is a handler that can be used within server APIs to verify tokens.
export const requireAuth = async (event: any) => {
  const authHeader = event.node.req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing authorization token' });
  }

  const decoded = await verifyIdToken(token);
  // Attach to event context
  (event as any).auth = decoded;
  return decoded;
};
