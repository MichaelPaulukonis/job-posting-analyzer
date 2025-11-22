import type { User } from 'firebase/auth';

export interface AuthServiceInterface {
  signInWithEmail(email: string, password: string): Promise<User>;
  signInWithGoogle(): Promise<User>;
  signUpWithEmail(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
  refreshIdToken(): Promise<string | null>;
  getCurrentUser(): User | null;
}
