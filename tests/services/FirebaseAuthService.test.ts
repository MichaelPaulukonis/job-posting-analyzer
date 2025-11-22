import type { Auth, User } from 'firebase/auth';
import { FirebaseAuthService } from '~/services/FirebaseAuthService';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

type FirebaseAuthModule = typeof import('firebase/auth');
const firebaseAuthMock = jest.requireMock('firebase/auth') as jest.Mocked<FirebaseAuthModule>;
const mockSignInWithEmailAndPassword = firebaseAuthMock.signInWithEmailAndPassword as jest.Mock;
const mockCreateUserWithEmailAndPassword = firebaseAuthMock.createUserWithEmailAndPassword as jest.Mock;
const mockSignOut = firebaseAuthMock.signOut as jest.Mock;
const mockSignInWithPopup = firebaseAuthMock.signInWithPopup as jest.Mock;
const mockGoogleAuthProvider = firebaseAuthMock.GoogleAuthProvider as jest.Mock;

const createMockUser = (overrides: Partial<User> = {}): User => (
  {
    uid: 'test-user',
    email: 'test@example.com',
    getIdToken: jest.fn(),
    ...overrides,
  } as unknown as User
);

describe('FirebaseAuthService', () => {
  let auth: Auth;
  let service: FirebaseAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    auth = { currentUser: null } as unknown as Auth;
    service = new FirebaseAuthService(auth);
  });

  it('signInWithEmail delegates to firebase and returns the user', async () => {
    const user = createMockUser();
    mockSignInWithEmailAndPassword.mockResolvedValue({ user });

    const result = await service.signInWithEmail('user@example.com', 'secret');

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'user@example.com', 'secret');
    expect(result).toBe(user);
  });

  it('signInWithGoogle uses popup provider', async () => {
    const user = createMockUser();
    const providerInstance = { providerId: 'google' };
    mockGoogleAuthProvider.mockImplementation(() => providerInstance);
    mockSignInWithPopup.mockResolvedValue({ user });

    const result = await service.signInWithGoogle();

    expect(mockGoogleAuthProvider).toHaveBeenCalledTimes(1);
    expect(mockSignInWithPopup).toHaveBeenCalledWith(auth, providerInstance);
    expect(result).toBe(user);
  });

  it('signUpWithEmail delegates to firebase and returns the user', async () => {
    const user = createMockUser();
    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user });

    const result = await service.signUpWithEmail('new@example.com', 'password123');

    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'new@example.com', 'password123');
    expect(result).toBe(user);
  });

  it('signOut invokes firebase signOut with the injected auth', async () => {
    mockSignOut.mockResolvedValue(undefined);

    await service.signOut();

    expect(mockSignOut).toHaveBeenCalledWith(auth);
  });

  it('getIdToken returns null when no user is present', async () => {
    const token = await service.getIdToken();
    expect(token).toBeNull();
  });

  it('getIdToken returns the token for the current user', async () => {
    const tokenFn = jest.fn().mockResolvedValue('token-123');
    auth.currentUser = createMockUser({ getIdToken: tokenFn as unknown as User['getIdToken'] });

    const token = await service.getIdToken();

    expect(tokenFn).toHaveBeenCalledWith(false);
    expect(token).toBe('token-123');
  });

  it('refreshIdToken forces a refresh on the current user', async () => {
    const tokenFn = jest.fn().mockResolvedValue('token-456');
    auth.currentUser = createMockUser({ getIdToken: tokenFn as unknown as User['getIdToken'] });

    const token = await service.refreshIdToken();

    expect(tokenFn).toHaveBeenCalledWith(true);
    expect(token).toBe('token-456');
  });

  it('getCurrentUser exposes the auth currentUser', () => {
    const user = createMockUser();
    auth.currentUser = user;

    expect(service.getCurrentUser()).toBe(user);
  });
});
