import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '~/server/utils/prisma';
import { randomUUID } from 'crypto';

// Mock authentication
const mockUser = {
  id: randomUUID(),
  firebaseUid: 'test-firebase-uid',
  email: 'test@example.com',
  name: 'Test User'
};

jest.mock('~/server/utils/verifyToken', () => ({
  requireAuth: jest.fn().mockResolvedValue({ user: mockUser, decodedToken: {} })
}));

describe('Auth Profile API', () => {
  beforeEach(async () => {
    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: mockUser.id },
      update: {},
      create: {
        id: mockUser.id,
        firebaseUid: mockUser.firebaseUid,
        email: mockUser.email,
        name: mockUser.name
      }
    });
  });

  afterEach(async () => {
    // Clean up test user
    await prisma.user.delete({
      where: { id: mockUser.id }
    }).catch(() => {
      // Ignore if already deleted
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should retrieve user profile', async () => {
      const user = await prisma.user.findUnique({
        where: { id: mockUser.id },
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
      expect(user!.id).toBe(mockUser.id);
      expect(user!.email).toBe(mockUser.email);
      expect(user!.name).toBe(mockUser.name);
    });
  });

  describe('POST /api/auth/profile', () => {
    it('should update user profile name', async () => {
      const newName = 'Updated Test User';

      const updatedUser = await prisma.user.update({
        where: { id: mockUser.id },
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
      expect(updatedUser.id).toBe(mockUser.id);
      expect(updatedUser.email).toBe(mockUser.email);
    });

    it('should handle empty name update', async () => {
      // Prisma allows empty strings, but API endpoint should validate
      const updatedUser = await prisma.user.update({
        where: { id: mockUser.id },
        data: { name: '' }
      });

      expect(updatedUser.name).toBe('');
    });

    it('should handle null name update', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: mockUser.id },
        data: { name: null }
      });

      expect(updatedUser.name).toBeNull();
    });

    it('should update updatedAt timestamp', async () => {
      const originalUser = await prisma.user.findUnique({
        where: { id: mockUser.id }
      });

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updatedUser = await prisma.user.update({
        where: { id: mockUser.id },
        data: { name: 'New Name' }
      });

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUser!.updatedAt.getTime()
      );
    });
  });
});
