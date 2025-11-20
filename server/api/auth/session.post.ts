import { H3Event, readBody } from 'h3';
import { defineEventHandler } from '#imports';
import * as admin from 'firebase-admin';

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event);
  const idToken = body?.token;

  if (!idToken) {
    return {
      statusCode: 401,
      message: 'Missing token'
    };
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken as string);
    return {
      ok: true,
      decoded
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || String(err),
      statusCode: 401
    };
  }
});
