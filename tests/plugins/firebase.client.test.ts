import path from 'path';

describe('Firebase client plugin', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('skips initialization when missing public config', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.doMock('#imports', () => ({
      defineNuxtPlugin: (fn: any) => fn,
      useRuntimeConfig: () => ({ public: {} }),
    }));

    const plugin = (await import('../../plugins/firebase.client')).default;
    const result: any = plugin({});

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Firebase client not initialized'));
    expect(result.provide.firebaseApp).toBeNull();
    expect(result.provide.firebaseAuth).toBeNull();
    consoleWarnSpy.mockRestore();
  });

  test('initializes when public config present', async () => {
    // Test fixture - not real Firebase credentials
    const TEST_FIREBASE_CONFIG = {
      FIREBASE_API_KEY: 'test-api-key-fixture',
      FIREBASE_AUTH_DOMAIN: 'test-domain',
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_APP_ID: '1:1:web:1'
    };
    
    jest.doMock('#imports', () => ({
      defineNuxtPlugin: (fn: any) => fn,
      useRuntimeConfig: () => ({ public: TEST_FIREBASE_CONFIG }),
    }));

    // Modules to verify calls
    const initializeApp = (await import('firebase/app')).initializeApp;
    const getAuth = (await import('firebase/auth')).getAuth;
    initializeApp.mockClear();
    getAuth.mockClear();

    const plugin = (await import('../../plugins/firebase.client')).default;
    const result: any = plugin({});
    expect(initializeApp).toHaveBeenCalled();
    expect(getAuth).toHaveBeenCalled();
    expect(result.provide.firebaseApp).toBeDefined();
    expect(result.provide.firebaseAuth).toBeDefined();
  });
});
