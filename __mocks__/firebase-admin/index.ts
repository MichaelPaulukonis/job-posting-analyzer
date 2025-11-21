import { cert as appCert, getApps, initializeApp as appInitializeApp } from './app';

const buildAuth = () => ({
  verifyIdToken: jest.fn(async () => ({ uid: 'server-mock-uid', email: 'server-mock@example.com' })),
  getUser: jest.fn(async (uid: string) => ({ uid, email: `${uid}@example.com` })),
});

const credential = {
  cert: appCert,
};

const auth = jest.fn(buildAuth);

const admin = {
  apps: getApps(),
  initializeApp: appInitializeApp,
  credential,
  auth,
};

export default admin;

// Ensure CommonJS consumers (like Jest's import) receive the object shape they expect
module.exports = admin;
