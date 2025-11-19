import { User } from 'firebase/auth';

declare module '#app' {
  interface NuxtApp {
    $firebaseApp?: any;
    $firebaseAuth?: any;
  }
}

export type AuthUser = User | null;
