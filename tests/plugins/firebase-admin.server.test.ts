const originalServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

describe('Firebase admin plugin', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    if (originalServiceAccount === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT = originalServiceAccount;
    }
  });

  test('does not initialize when FIREBASE_SERVICE_ACCOUNT is missing', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.doMock('#imports', () => ({ defineNitroPlugin: (fn: any) => fn, useRuntimeConfig: () => ({}) }));
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    const admin = await import('firebase-admin');
    admin.initializeApp.mockClear();

    const plugin = (await import('../../server/plugins/firebase-admin.server')).default;
    // call plugin with dummy nitro app
    await plugin({});
    expect(admin.initializeApp).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('Firebase Admin initialization failed', expect.any(Error));
    consoleWarnSpy.mockRestore();
  });

  test('initializes when FIREBASE_SERVICE_ACCOUNT JSON string present', async () => {
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    // Test fixture - not a real service account
    const TEST_SERVICE_ACCOUNT = {
      type: 'service_account',
      project_id: 'test',
      private_key: '-----BEGIN PRIVATE KEY-----\nTESTKEY\n-----END PRIVATE KEY-----\n',
      client_email: 'firebase-admin@test.iam.gserviceaccount.com',
    };
    const serviceAccount = JSON.stringify(TEST_SERVICE_ACCOUNT);
    jest.doMock('#imports', () => ({ defineNitroPlugin: (fn: any) => fn, useRuntimeConfig: () => ({ FIREBASE_SERVICE_ACCOUNT: serviceAccount }) }));
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    const admin = await import('firebase-admin');
    admin.initializeApp.mockClear();

    const plugin = (await import('../../server/plugins/firebase-admin.server')).default;
    await plugin({});
    expect(admin.initializeApp).toHaveBeenCalled();
    expect(consoleInfoSpy).toHaveBeenCalledWith('Firebase Admin initialized');
    consoleInfoSpy.mockRestore();
  });
});
