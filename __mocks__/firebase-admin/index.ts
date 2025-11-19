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
