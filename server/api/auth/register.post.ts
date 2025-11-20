import { H3Event } from 'h3';
import { defineEventHandler } from '#imports';

// Registration endpoint removed — use Firebase client SDK to create users or the Admin SDK on server-side.
export default defineEventHandler(async () => {
  return {
    statusCode: 501,
    message: 'Registration endpoint removed. Use Firebase Auth to create users client-side or use Firebase Admin on server.'
  };
});
