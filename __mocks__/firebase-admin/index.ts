const admin = {
  apps: [],
  initializeApp: jest.fn(() => { admin.apps.push({ initialized: true }); return { admin: true }; }),
  credential: {
    cert: jest.fn((obj) => obj)
  },
  auth: jest.fn(() => ({ verifyIdToken: jest.fn(async (token) => ({ uid: 'mock-uid' })) }))
};

module.exports = admin;
// Mock for firebase-admin node SDK used in server-side tests
const mockAuth = {
  verifyIdToken: async (token: string) => {
    // return a minimal decoded token object
    return Promise.resolve({ uid: 'server-mock-uid', email: 'server-mock@example.com' });
  },
  getUser: async (uid: string) => ({ uid, email: `${uid}@example.com` }),
};

export function initializeApp() {
  return {}; // no-op
}

export function auth() {
  return mockAuth;
}

export default {
  initializeApp,
  auth,
};
