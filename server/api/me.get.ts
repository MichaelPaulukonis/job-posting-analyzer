import { defineEventHandler } from '#imports';
import { requireAuth } from '~/server/middleware/verifyToken';

export default defineEventHandler(async (event) => {
  const decoded = await requireAuth(event);
  return {
    ok: true,
    user: {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || null,
    }
  };
});
