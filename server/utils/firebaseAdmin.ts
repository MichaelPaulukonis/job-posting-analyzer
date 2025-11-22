import { useRuntimeConfig } from '#imports';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

export const ensureFirebaseAdmin = (): void => {
  if (getApps().length > 0) {
    return;
  }

  const config = useRuntimeConfig();
  const rawCredentials = (config as Record<string, unknown>)?.FIREBASE_SERVICE_ACCOUNT ?? process.env.FIREBASE_SERVICE_ACCOUNT;
  const credentials = parseServiceAccount(rawCredentials);

  if (!credentials) {
    throw new Error(
      'Firebase Admin credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT to a JSON payload, base64-encoded JSON, or path to a service account key.'
    );
  }

  try {
    initializeApp({
      credential: cert(credentials)
    });
  } catch (error) {
    console.warn('Firebase Admin initialization failed', error);
    throw error;
  }
};

export async function verifyIdToken(token: string) {
  ensureFirebaseAdmin();
  return await getAuth().verifyIdToken(token);
}
