const mockUserFactory = (email: string) => ({
  uid: 'mock-uid',
  email,
  getIdToken: jest.fn(async () => 'mock-token')
});

const authState = {
  currentUser: null as null | ReturnType<typeof mockUserFactory>
};

export const getAuth = jest.fn(() => authState);

export const onAuthStateChanged = jest.fn((auth, next: (user: any) => void) => {
  next?.(auth.currentUser);
  return () => {};
});

export const signInWithEmailAndPassword = jest.fn(async (_auth, email: string) => {
  authState.currentUser = mockUserFactory(email);
  return { user: authState.currentUser };
});

export const createUserWithEmailAndPassword = jest.fn(async (_auth, email: string) => {
  authState.currentUser = mockUserFactory(email);
  return { user: authState.currentUser };
});

export const signOut = jest.fn(async () => {
  authState.currentUser = null;
});

export class GoogleAuthProvider {}

export const signInWithPopup = jest.fn(async () => {
  authState.currentUser = mockUserFactory('google-user@example.com');
  return { user: authState.currentUser };
});

export const browserLocalPersistence = Symbol('browserLocalPersistence');
export const setPersistence = jest.fn(async () => undefined);

export default {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence
};
