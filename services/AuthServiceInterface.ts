export interface AuthServiceInterface {
  signInWithEmail(email: string, password: string): Promise<any>;
  signUpWithEmail(email: string, password: string): Promise<any>;
  signOut(): Promise<void>;
  getIdToken(): Promise<string | null>;
  getCurrentUser(): any | null;
}
