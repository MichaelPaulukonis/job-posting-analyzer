import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { defineEventHandler } from '#imports';
import { requireAuth } from '~/server/utils/verifyToken';
import handler from '~/server/api/auth/session.post';
import { readBody } from 'h3';

jest.mock('#imports', () => ({
  defineEventHandler: (fn: any) => fn
}));
jest.mock('h3', () => ({
  readBody: jest.fn()
}));
jest.mock('~/server/utils/verifyToken', () => ({
  requireAuth: jest.fn()
}));

const mockRequireAuth = requireAuth as jest.Mock;

const createEvent = (body: any = {}) => ({
  context: {},
  node: {
    req: {
      headers: {},
      body,
      method: 'POST',
      url: '/api/auth/session',
    },
    res: {}
  }
});

describe('/api/auth/session endpoint', () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    (readBody as jest.Mock).mockReset();
  });

  it('returns decoded token for valid token', async () => {
    const decoded = { uid: 'user-abc' };
    mockRequireAuth.mockResolvedValue(decoded);
    const event = createEvent();
    (readBody as jest.Mock).mockResolvedValue({ token: 'valid-token' });
    const result = await handler(event);
    expect(result).toEqual({ ok: true, decoded, authDisabled: false });
  });

  it('returns null decoded and authDisabled true if requireAuth returns null', async () => {
    mockRequireAuth.mockResolvedValue(null);
    const event = createEvent();
    (readBody as jest.Mock).mockResolvedValue({ token: null });
    const result = await handler(event);
    expect(result).toEqual({ ok: true, decoded: null, authDisabled: true });
  });

  it('throws 401 for invalid/expired token', async () => {
    mockRequireAuth.mockRejectedValue({ statusCode: 401, statusMessage: 'Invalid or expired authorization token' });
    const event = createEvent();
    (readBody as jest.Mock).mockResolvedValue({ token: 'bad-token' });
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 });
  });
});
