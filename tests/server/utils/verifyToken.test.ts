import type { H3Event } from 'h3';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('#imports', () => ({
  createError: ({ statusCode, statusMessage }: { statusCode?: number; statusMessage?: string }) => {
    const error = new Error(statusMessage ?? 'Nuxt error');
    (error as any).statusCode = statusCode ?? 500;
    return error;
  },
  useRuntimeConfig: jest.fn()
}));

jest.mock('~/server/utils/firebaseAdmin', () => ({
  verifyIdToken: jest.fn()
}));

jest.mock('~/server/services/AuthService', () => ({
  authService: {
    syncUser: jest.fn()
  }
}));

import { requireAuth } from '~/server/utils/verifyToken';
import { useRuntimeConfig } from '#imports';
import { verifyIdToken } from '~/server/utils/firebaseAdmin';
import { authService } from '~/server/services/AuthService';

const mockUseRuntimeConfig = useRuntimeConfig as jest.Mock;
const mockVerifyIdToken = verifyIdToken as jest.Mock;

type HeaderDict = Record<string, string | undefined>;

const createEvent = (headers: HeaderDict = {}): H3Event => ({
  context: {},
  node: {
    req: { headers } as any,
    res: {} as any
  } as any
}) as H3Event;

describe('requireAuth helper', () => {
  beforeEach(() => {
    mockUseRuntimeConfig.mockReturnValue({ public: { authDisabled: false } });
    mockVerifyIdToken.mockReset();
  });

  it('returns empty decodedToken when authDisabled flag is set', async () => {
    mockUseRuntimeConfig.mockReturnValue({ public: { authDisabled: true } });
    const result = await requireAuth(createEvent());
    expect(result).toEqual({ decodedToken: {} });
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('verifies bearer tokens and attaches decoded payload to context', async () => {
    const decoded = { uid: 'user-123' };
    mockVerifyIdToken.mockResolvedValue(decoded);
    const event = createEvent({ authorization: 'Bearer token-abc' });

    const result = await requireAuth(event);

    expect(result).toEqual({ decodedToken: decoded, user: undefined });
    expect(mockVerifyIdToken).toHaveBeenCalledWith('token-abc');
    expect((event.context as any).auth).toEqual(decoded);
  });

  it('throws when no token is provided', async () => {
    await expect(requireAuth(createEvent())).rejects.toMatchObject({ statusCode: 401 });
  });
    it('throws when verifyIdToken throws (invalid/expired token)', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));
      const event = createEvent({ authorization: 'Bearer expired-token' });
      await expect(requireAuth(event)).rejects.toMatchObject({ statusCode: 401 });
    });
});
