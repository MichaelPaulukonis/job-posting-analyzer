import { useAuth } from '~/composables/useAuth';

describe('useAuth composable (placeholder)', () => {
  it('exports the expected functions', () => {
    const { signInWithEmail, signUpWithEmail, signOut, getIdToken, user, isAuthenticated } = useAuth();
    expect(typeof signInWithEmail).toBe('function');
    expect(typeof signUpWithEmail).toBe('function');
    expect(typeof signOut).toBe('function');
    expect(typeof getIdToken).toBe('function');
    expect(user).toHaveProperty('value');
    expect(isAuthenticated).toHaveProperty('value');
  });
});
