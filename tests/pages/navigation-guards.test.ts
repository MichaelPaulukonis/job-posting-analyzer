import { authGuard } from '~/middleware/auth-guard';

beforeAll(() => {
  // Simulate browser environment for tests
  (global as any).window = {};
});

describe('authGuard', () => {
  it('redirects unauthenticated user from protected route', async () => {
    const to = { meta: { requiresAuth: true }, fullPath: '/admin', query: {} };
    const result = await authGuard(to, {
      isAuthenticated: { value: false },
      waitForAuthReady: async () => {}
    });
    expect(result).toEqual({ path: '/login', query: { redirect: '/admin' } });
  });

  it('redirects authenticated user from guest-only route', async () => {
    const to = { meta: { requiresGuest: true }, fullPath: '/login', query: {} };
    const result = await authGuard(to, {
      isAuthenticated: { value: true },
      waitForAuthReady: async () => {}
    });
    expect(result).toBe('/');
  });

  it('allows access to unprotected route', async () => {
    const to = { meta: {}, fullPath: '/', query: {} };
    const result = await authGuard(to, {
      isAuthenticated: { value: false },
      waitForAuthReady: async () => {}
    });
    expect(result).toBeUndefined();
  });
});
