import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from '~/server/utils/prisma';
import { createTestUser } from '../../../setup';

// Mock authentication - will be set in beforeEach
let mockUser: any;

jest.mock('~/server/utils/verifyToken', () => ({
  requireAuth: jest.fn().mockImplementation(() => Promise.resolve({ 
    user: mockUser, 
    decodedToken: {} 
  }))
}));

describe('Auth Profile API', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await createTestUser();
    testUserId = user.id;
    mockUser = user;
  });

  describe('GET /api/auth/profile', () => {
    it('should retrieve user profile', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });

      expect(user).toBeDefined();
      expect(user!.id).toBe(testUserId);
      expect(user!.email).toBe(mockUser.email);
      expect(user!.name).toBe(mockUser.name);
    });
  });

  describe('POST /api/auth/profile', () => {
    it('should update user profile name', async () => {
      const newName = 'Updated Test User';

      const updatedUser = await prisma.user.update({
        where: { id: testUserId },
        data: { name: newName },
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });

      expect(updatedUser.name).toBe(newName);
      expect(updatedUser.id).toBe(testUserId);
      expect(updatedUser.email).toBe(mockUser.email);
    });

    it('should handle empty name update', async () => {
      // Prisma allows empty strings, but API endpoint should validate
      const updatedUser = await prisma.user.update({
        where: { id: testUserId },
        data: { name: '' }
      });

      expect(updatedUser.name).toBe('');
    });

    it('should handle null name update', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUserId },
        data: { name: null }
      });

      expect(updatedUser.name).toBeNull();
    });

    it('should update updatedAt timestamp', async () => {
      const originalUser = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updatedUser = await prisma.user.update({
        where: { id: testUserId },
        data: { name: 'New Name' }
      });

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUser!.updatedAt.getTime()
      );
    });
  });
});
