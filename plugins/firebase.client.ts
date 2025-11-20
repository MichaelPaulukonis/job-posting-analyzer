import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { defineNuxtPlugin, useRuntimeConfig } from '#imports';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const firebaseConfig = {
    apiKey: config.public.FIREBASE_API_KEY,
    authDomain: config.public.FIREBASE_AUTH_DOMAIN,
    projectId: config.public.FIREBASE_PROJECT_ID,
    storageBucket: config.public.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.public.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.public.FIREBASE_APP_ID
  };

  // If required frontend config is missing, don't initialize Firebase and warn.
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = requiredKeys.filter(k => !firebaseConfig[k as keyof typeof firebaseConfig]);
  if (missing.length > 0) {
    console.warn(`Firebase client not initialized; missing public config keys: ${missing.join(', ')}`);
    return {
      provide: {
        firebaseApp: null,
        firebaseAuth: null
      }
    };
  }

  // TODO: handle re-initialization gracefully
  let app = null;
  let auth = null;
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (err: any) {
    console.warn('Firebase client initialization failed:', err?.message || err);
    return {
      provide: {
        firebaseApp: null,
        firebaseAuth: null
      }
    };
  }

  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth
    }
  };
});
