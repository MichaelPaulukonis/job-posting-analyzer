import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type User
} from 'firebase/auth';
import type { AuthServiceInterface } from './AuthServiceInterface';

export class FirebaseAuthService implements AuthServiceInterface {
  private readonly auth: Auth;

  constructor(authInstance?: Auth) {
    this.auth = authInstance ?? getAuth();
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      return credential.user;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async refreshIdToken(): Promise<string | null> {
    return this.getIdToken(true);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser ?? null;
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    return new Error('Firebase authentication error');
  }
}
