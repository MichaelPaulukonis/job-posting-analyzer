import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { requireAuth } from '~/server/middleware/verifyToken';

jest.mock('~/server/utils/verifyToken', () => ({
  requireAuth: jest.fn()
}));

const mockRequireAuth = requireAuth as jest.Mock;

describe('verifyToken middleware', () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
  });

  it('exports requireAuth utility', () => {
    expect(typeof requireAuth).toBe('function');
  });

  it('calls requireAuth utility as expected', async () => {
    mockRequireAuth.mockResolvedValue({ uid: 'user-xyz' });
    const event = { context: {}, node: { req: { headers: { authorization: 'Bearer valid-token' } }, res: {} } };
    const result = await requireAuth(event);
    expect(result).toEqual({ uid: 'user-xyz' });
  });
});
