const buildAuth = () => ({
  verifyIdToken: jest.fn(async () => ({ uid: 'server-mock-uid', email: 'server-mock@example.com' })),
  getUser: jest.fn(async (uid: string) => ({ uid, email: `${uid}@example.com` })),
  setCustomUserClaims: jest.fn(async () => undefined),
});

export const getAuth = jest.fn(buildAuth);

export default {
  getAuth,
};

module.exports = {
  getAuth,
};
