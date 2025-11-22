import { defineNitroPlugin } from '#imports';
import { ensureFirebaseAdmin } from '~/server/utils/firebaseAdmin';

export default defineNitroPlugin(() => {
  try {
    ensureFirebaseAdmin();
    console.info('Firebase Admin initialized');
  } catch (error) {
    console.warn('Firebase Admin initialization failed', error);
  }
});
