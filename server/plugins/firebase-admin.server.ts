import { defineNitroPlugin, useRuntimeConfig } from '#imports';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';
import { readFileSync } from 'fs';

const parseServiceAccount = (raw: unknown): ServiceAccount | null => {
  if (!raw) {
    return null;
  }

  try {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('{')) {
        return JSON.parse(trimmed);
      }
      if (trimmed.endsWith('.json') || trimmed.includes('/') || trimmed.includes('\\')) {
        const fileContents = readFileSync(trimmed, { encoding: 'utf-8' });
        return JSON.parse(fileContents);
      }
      // Assume base64-encoded service account JSON
      const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    }

    if (typeof raw === 'object') {
      return raw as ServiceAccount;
    }
  } catch (error) {
    console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
    return null;
  }

  console.warn('Unsupported FIREBASE_SERVICE_ACCOUNT format; must be path, JSON string, or object');
  return null;
};

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig();

  try {
    if (getApps().length > 0) {
      return;
    }

    const credentials = parseServiceAccount(config.FIREBASE_SERVICE_ACCOUNT);
    if (!credentials) {
      console.info('Firebase Admin not initialized; missing FIREBASE_SERVICE_ACCOUNT');
      return;
    }

    initializeApp({
      credential: cert(credentials),
    });

    console.info('Firebase Admin initialized');
  } catch (error) {
    console.warn('Firebase Admin initialization failed', error);
  }
});
