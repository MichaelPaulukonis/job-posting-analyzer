import { computed, ref } from 'vue';
import type { Auth, User } from 'firebase/auth';
import {
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';

const user = ref<User | null>(null);
const authReady = ref(false);
const authLoading = ref(false);
const actionPending = ref(false);
const authError = ref<string | null>(null);
const lastActionError = ref<string | null>(null);
const isAuthenticated = computed(() => !!user.value);

let unsubscribe: (() => void) | null = null;
let persistenceConfigured = false;
const readinessQueue: Array<() => void> = [];

const isClient = () => typeof window !== 'undefined';

const getNuxtAppInstance = () => {
  const getter = (globalThis as any)?.useNuxtApp;
  if (typeof getter === 'function') {
    try {
      return getter();
    } catch (err) {
      console.warn('Unable to access Nuxt app instance for auth:', err);
    }
  }
  return null;
};

const resolveFirebaseAuth = (): Auth | null => {
  const nuxtApp = getNuxtAppInstance();
  return (nuxtApp as any)?.$firebaseAuth ?? null;
};

const notifyReady = () => {
  authReady.value = true;
  authLoading.value = false;
  while (readinessQueue.length) {
    readinessQueue.shift()?.();
  }
};

const ensureAuthListener = () => {
  if (!isClient() || unsubscribe) {
    return;
  }

  const auth = resolveFirebaseAuth();
  if (!auth) {
    authError.value = 'Firebase client is not configured';
    notifyReady();
    return;
  }

  authLoading.value = true;
  unsubscribe = onAuthStateChanged(
    auth,
    (firebaseUser) => {
      user.value = firebaseUser;
      authError.value = null;
      notifyReady();
    },
    (error) => {
      console.error('Firebase auth listener error', error);
      authError.value = error?.message || 'Unable to resolve authentication state';
      notifyReady();
    }
  );
};

const ensurePersistence = async (auth: Auth) => {
  if (persistenceConfigured || !isClient()) return;
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn('Unable to set Firebase auth persistence', error);
  } finally {
    persistenceConfigured = true;
  }
};

const getAuthOrThrow = (): Auth => {
  const auth = resolveFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not initialized');
  }
  return auth;
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error('Authentication failed');
};

const runAuthAction = async <T>(action: () => Promise<T>): Promise<T> => {
  if (!isClient()) {
    throw new Error('Authentication actions are only available in the browser');
  }

  actionPending.value = true;
  lastActionError.value = null;

  try {
    const result = await action();
    return result;
  } catch (error) {
    const normalized = normalizeError(error);
    lastActionError.value = normalized.message;
    throw normalized;
  } finally {
    actionPending.value = false;
  }
};

const waitForAuthReady = async (): Promise<void> | void => {
  if (!isClient() || authReady.value) {
    return;
  }

  ensureAuthListener();

  return new Promise<void>((resolve) => {
    readinessQueue.push(resolve);
  });
};

export function useAuth() {
  if (isClient()) {
    ensureAuthListener();
  }

  async function signInWithEmail(email: string, password: string) {
    const auth = getAuthOrThrow();
    await ensurePersistence(auth);
    return runAuthAction(async () => {
      const credential = await firebaseSignInWithEmailAndPassword(auth, email, password);
      return credential.user;
    });
  }

  async function signInWithGoogle() {
    const auth = getAuthOrThrow();
    await ensurePersistence(auth);
    return runAuthAction(async () => {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      return credential.user;
    });
  }

  async function signUpWithEmail(email: string, password: string) {
    const auth = getAuthOrThrow();
    await ensurePersistence(auth);
    return runAuthAction(async () => {
      const credential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
      return credential.user;
    });
  }

  async function signOut() {
    const auth = getAuthOrThrow();
    await runAuthAction(async () => {
      await firebaseSignOut(auth);
      user.value = null;
      authReady.value = true;
    });
  }

  async function getIdToken() {
    if (!isClient()) return null;
    const current = user.value ?? resolveFirebaseAuth()?.currentUser;
    if (!current) return null;
    try {
      const token = await current.getIdToken?.();
      return token ?? null;
    } catch (error) {
      console.warn('Unable to fetch ID token', error);
      return null;
    }
  }

  const clearActionError = () => {
    lastActionError.value = null;
  };

  return {
    user,
    isAuthenticated,
    authReady,
    authLoading,
    actionPending,
    authError,
    lastActionError,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    signInWithGoogle,
    getIdToken,
    waitForAuthReady,
    clearActionError
  };
}
