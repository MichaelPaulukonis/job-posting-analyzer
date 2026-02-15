import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { AuthService } from '~/server/services/AuthService';

// Create mock functions
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

// Mock Prisma - define mocks first, then mock the module
jest.mock('~/server/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}));

// Get the mocked prisma instance
import { prisma } from '~/server/utils/prisma';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    
    // Reset all mocks
    (prisma.user.findUnique as jest.Mock).mockClear();
    (prisma.user.create as jest.Mock).mockClear();
    (prisma.user.update as jest.Mock).mockClear();
  });

  describe('getUserByFirebaseUid', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        firebaseUid: 'firebase-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.getUserByFirebaseUid('firebase-123');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-123' }
      });
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.getUserByFirebaseUid('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUser = {
        id: 'user-123',
        firebaseUid: 'firebase-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });
  });

  describe('createOrUpdateUser', () => {
    it('should create new user when user does not exist', async () => {
      const decodedToken: DecodedIdToken = {
        uid: 'firebase-123',
        email: 'newuser@example.com',
        name: 'New User',
        aud: '',
        auth_time: 0,
        exp: 0,
        firebase: { identities: {}, sign_in_provider: '' },
        iat: 0,
        iss: '',
        sub: ''
      };

      const mockCreatedUser = {
        id: 'user-new',
        firebaseUid: 'firebase-123',
        email: 'newuser@example.com',
        name: 'New User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await authService.createOrUpdateUser(decodedToken);

      expect(result).toEqual(mockCreatedUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          firebaseUid: 'firebase-123',
          email: 'newuser@example.com',
          name: 'New User'
        }
      });
    });

    it('should return existing user when found by Firebase UID', async () => {
      const decodedToken: DecodedIdToken = {
        uid: 'firebase-123',
        email: 'existing@example.com',
        name: 'Existing User',
        aud: '',
        auth_time: 0,
        exp: 0,
        firebase: { identities: {}, sign_in_provider: '' },
        iat: 0,
        iss: '',
        sub: ''
      };

      const mockExistingUser = {
        id: 'user-existing',
        firebaseUid: 'firebase-123',
        email: 'existing@example.com',
        name: 'Existing User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);

      const result = await authService.createOrUpdateUser(decodedToken);

      expect(result).toEqual(mockExistingUser);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should update user name when it has changed', async () => {
      const decodedToken: DecodedIdToken = {
        uid: 'firebase-123',
        email: 'user@example.com',
        name: 'Updated Name',
        aud: '',
        auth_time: 0,
        exp: 0,
        firebase: { identities: {}, sign_in_provider: '' },
        iat: 0,
        iss: '',
        sub: ''
      };

      const mockExistingUser = {
        id: 'user-123',
        firebaseUid: 'firebase-123',
        email: 'user@example.com',
        name: 'Old Name',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUpdatedUser = {
        ...mockExistingUser,
        name: 'Updated Name'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await authService.createOrUpdateUser(decodedToken);

      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: 'Updated Name' }
      });
    });

    it('should update existing user with Firebase UID when found by email', async () => {
      const decodedToken: DecodedIdToken = {
        uid: 'firebase-new',
        email: 'existing@example.com',
        name: 'User Name',
        aud: '',
        auth_time: 0,
        exp: 0,
        firebase: { identities: {}, sign_in_provider: '' },
        iat: 0,
        iss: '',
        sub: ''
      };

      const mockUserByEmail = {
        id: 'user-123',
        firebaseUid: null as any,
        email: 'existing@example.com',
        name: 'Old Name',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUpdatedUser = {
        ...mockUserByEmail,
        firebaseUid: 'firebase-new',
        name: 'User Name'
      };

      // First call (by Firebase UID) returns null, second call (by email) returns user
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUserByEmail);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await authService.createOrUpdateUser(decodedToken);

      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { firebaseUid: 'firebase-new', name: 'User Name' }
      });
    });

    it('should throw error when email is missing', async () => {
      const decodedToken: DecodedIdToken = {
        uid: 'firebase-123',
        email: undefined as any,
        aud: '',
        auth_time: 0,
        exp: 0,
        firebase: { identities: {}, sign_in_provider: '' },
        iat: 0,
        iss: '',
        sub: ''
      };

      await expect(authService.createOrUpdateUser(decodedToken)).rejects.toThrow(
        'Email is required for user creation'
      );
    });
  });

  describe('syncUser', () => {
    it('should call createOrUpdateUser', async () => {
      const decodedToken: DecodedIdToken = {
        uid: 'firebase-123',
        email: 'test@example.com',
        name: 'Test User',
        aud: '',
        auth_time: 0,
        exp: 0,
        firebase: { identities: {}, sign_in_provider: '' },
        iat: 0,
        iss: '',
        sub: ''
      };

      const mockUser = {
        id: 'user-123',
        firebaseUid: 'firebase-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.syncUser(decodedToken);

      expect(result).toEqual(mockUser);
    });
  });
});