import * as admin from 'firebase-admin';

export async function verifyIdToken(token: string) {
  if (!admin.apps || admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized');
  }
  return await admin.auth().verifyIdToken(token);
}
