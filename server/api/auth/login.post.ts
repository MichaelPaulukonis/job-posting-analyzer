import { defineEventHandler } from '#imports';

// Login endpoint removed — authenticate using Firebase client SDK and verify via the Admin SDK on the server.
export default defineEventHandler(async () => {
  return {
    statusCode: 501,
    message: 'Login endpoint removed. Use Firebase Auth client SDK and server-side token verification via Firebase Admin.'
  };
});
