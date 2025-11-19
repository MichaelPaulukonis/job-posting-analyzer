import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import type { AuthServiceInterface } from './AuthServiceInterface';

export class FirebaseAuthService implements AuthServiceInterface {
  auth: any;

  constructor() {
    this.auth = getAuth();
  }

  async signInWithEmail(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(this.auth, provider);
  }

  async signUpWithEmail(email: string, password: string) {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async signOut() {
    return await firebaseSignOut(this.auth);
  }

  async getIdToken() {
    const user = this.auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }

  getCurrentUser() {
    return this.auth.currentUser || null;
  }
}
