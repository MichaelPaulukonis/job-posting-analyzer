describe('Firebase admin plugin', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('does not initialize when FIREBASE_SERVICE_ACCOUNT is missing', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.doMock('#imports', () => ({ defineNitroPlugin: (fn: any) => fn, useRuntimeConfig: () => ({}) }));
    const admin = await import('firebase-admin');
    admin.initializeApp.mockClear();

    const plugin = (await import('../../server/plugins/firebase-admin.server')).default;
    // call plugin with dummy nitro app
    await plugin({});
    expect(admin.initializeApp).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled(); // it returns early silently for missing config
    consoleWarnSpy.mockRestore();
  });

  test('initializes when FIREBASE_SERVICE_ACCOUNT JSON string present', async () => {
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const serviceAccount = JSON.stringify({
      type: 'service_account',
      project_id: 'test',
      private_key: '-----BEGIN PRIVATE KEY-----\nTESTKEY\n-----END PRIVATE KEY-----\n',
      client_email: 'firebase-admin@test.iam.gserviceaccount.com',
    });
    jest.doMock('#imports', () => ({ defineNitroPlugin: (fn: any) => fn, useRuntimeConfig: () => ({ FIREBASE_SERVICE_ACCOUNT: serviceAccount }) }));
    const admin = await import('firebase-admin');
    admin.initializeApp.mockClear();

    const plugin = (await import('../../server/plugins/firebase-admin.server')).default;
    await plugin({});
    expect(admin.initializeApp).toHaveBeenCalled();
    expect(consoleInfoSpy).toHaveBeenCalledWith('Firebase Admin initialized');
    consoleInfoSpy.mockRestore();
  });
});
