import { defineEventHandler } from '#imports';
import { requireAuth as requireAuthUtil } from '~/server/utils/verifyToken';

// Default middleware export is a no-op to avoid being applied globally; use `requireAuthUtil` to explicitly verify tokens.
export default defineEventHandler(async () => {
  // no-op middleware
});

export const requireAuth = requireAuthUtil;
