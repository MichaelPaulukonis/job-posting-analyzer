import { ref, onMounted, onUnmounted } from 'vue';
import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword as _signInWithEmailAndPassword,
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
  signOut as _firebaseSignOut,
  onAuthStateChanged as _onAuthStateChanged
} from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup as _signInWithPopup } from 'firebase/auth';

const user = ref<User | null>(null);
const isAuthenticated = ref(false);

export function useAuth() {
  // Implement auth flow using "firebaseAuth" injected by plugin.
  // This composable exposes: user, isAuthenticated, signInWithEmail, signUpWithEmail, signOut, getIdToken

  async function signInWithEmail(email: string, password: string) {
    const nuxtApp = useNuxtApp();
    const auth = (nuxtApp as any).$firebaseAuth;
    if (!auth) throw new Error('Firebase Auth not initialized');
    return await _signInWithEmailAndPassword(auth, email, password);
  }

  async function signInWithGoogle() {
    const nuxtApp = useNuxtApp();
    const auth = (nuxtApp as any).$firebaseAuth;
    if (!auth) throw new Error('Firebase Auth not initialized');
    const provider = new GoogleAuthProvider();
    return await _signInWithPopup(auth, provider);
  }

  async function signUpWithEmail(email: string, password: string) {
    const nuxtApp = useNuxtApp();
    const auth = (nuxtApp as any).$firebaseAuth;
    if (!auth) throw new Error('Firebase Auth not initialized');
    return await _createUserWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    const nuxtApp = useNuxtApp();
    const auth = (nuxtApp as any).$firebaseAuth;
    if (!auth) throw new Error('Firebase Auth not initialized');
    await _firebaseSignOut(auth);
    user.value = null;
    isAuthenticated.value = false;
  }

  async function getIdToken() {
    const nuxtApp = useNuxtApp();
    const auth = (nuxtApp as any).$firebaseAuth;
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    return await currentUser.getIdToken?.();
  }

  // Track auth state with onAuthStateChanged
  let unsubscribe: any;
  onMounted(() => {
    const nuxtApp = useNuxtApp();
    const auth = (nuxtApp as any).$firebaseAuth;
    if (!auth) return;
    unsubscribe = _onAuthStateChanged(auth, (u: User | null) => {
      user.value = u;
      isAuthenticated.value = !!u;
    });
  });

  onUnmounted(() => {
    if (typeof unsubscribe === 'function') unsubscribe();
  });

  return {
    user,
    isAuthenticated,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    signInWithGoogle,
    getIdToken
  };
}
