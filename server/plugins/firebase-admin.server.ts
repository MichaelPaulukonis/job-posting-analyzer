import { defineNitroPlugin } from '#imports';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();
  try {
    if (admin.apps.length === 0) {
      let credentials: any = null;
      const serviceAccount = config.FIREBASE_SERVICE_ACCOUNT;
      if (!serviceAccount) {
        // No service account configured for server-run, skip initialization
        return;
      }

      try {
        // If the env var is a path, load the JSON file
        if (serviceAccount.trim().startsWith('{')) {
          credentials = JSON.parse(serviceAccount);
        } else {
          const fileContents = readFileSync(serviceAccount, { encoding: 'utf-8' });
          credentials = JSON.parse(fileContents);
        }
      } catch (err) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT:', err);
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });

      console.info('Firebase Admin initialized');
    }
  } catch (e) {
    console.warn('Firebase Admin initialization failed', e);
  }
});
