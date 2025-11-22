import { H3Event, readBody } from 'h3';
import { defineEventHandler } from '#imports';
import { requireAuth } from '~/server/utils/verifyToken';

interface SessionRequestBody {
  token?: string | null;
}

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody<SessionRequestBody>(event);
  const decoded = await requireAuth(event, { token: body?.token });

  return {
    ok: true,
    decoded: decoded ?? null,
    authDisabled: decoded === null
  };
});
