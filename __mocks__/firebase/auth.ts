// Simple Jest mock for `firebase/auth` module
// Provides the basic functions used by the project's FirebaseAuthService and composables

export function getAuth() {
  // Returns a mock auth object; tests can override as needed
  return {
    currentUser: { uid: 'mock-uid', email: 'mock@user.local' },
    onAuthStateChanged: (cb: (u: any) => void) => cb({ uid: 'mock-uid', email: 'mock@user.local' }),
  };
}

export async function signInWithEmailAndPassword(auth: any, email: string, password: string) {
  return Promise.resolve({ user: { uid: 'signed-in-uid', email } });
}

export async function createUserWithEmailAndPassword(auth: any, email: string, password: string) {
  return Promise.resolve({ user: { uid: 'created-uid', email } });
}

export async function signOut(auth: any) {
  return Promise.resolve();
}

export class GoogleAuthProvider {}

export async function signInWithPopup(auth: any, provider: any) {
  return Promise.resolve({ user: { uid: 'google-uid', email: 'google-user@example.com' } });
}

// Basic User interface shape used for tests
export interface User {
  uid: string;
  email?: string;
}
