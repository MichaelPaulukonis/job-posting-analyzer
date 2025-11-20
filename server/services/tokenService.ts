// tokenService was removed in favor of Firebase Auth for authentication
// This file now exports a minimal no-op to avoid import errors during migration.

export const generateTokens = async (_userId: string) => {
  throw new Error('generateTokens is no longer available. Use Firebase Auth for token management.');
};

export const verifyToken = (_token: string) => {
  throw new Error('verifyToken is no longer available. Use Firebase Admin SDK to verify idTokens.');
};

export const refreshAccessToken = async (_token: string) => {
  throw new Error('refreshAccessToken is no longer available. Use Firebase refresh logic via client-side SDK.');
};

export default { generateTokens, verifyToken, refreshAccessToken };
