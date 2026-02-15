import type { DecodedIdToken } from 'firebase-admin/auth';
import type { User } from '@prisma/client';
import { prisma } from '~/server/utils/prisma';

export class AuthService {
  /**
   * Get user by Firebase UID from database
   */
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { firebaseUid }
    });
  }

  /**
   * Get user by email from database
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Create or update user in database based on Firebase token
   * This synchronizes Firebase users with our PostgreSQL database
   */
  async createOrUpdateUser(decodedToken: DecodedIdToken): Promise<User> {
    const { uid: firebaseUid, email, name } = decodedToken;

    if (!email) {
      throw new Error('Email is required for user creation');
    }

    // Check if user exists by Firebase UID
    const existingUser = await this.getUserByFirebaseUid(firebaseUid);

    if (existingUser) {
      // Update user if name has changed
      if (name && existingUser.name !== name) {
        return await prisma.user.update({
          where: { id: existingUser.id },
          data: { name }
        });
      }
      return existingUser;
    }

    // Check if user exists by email (for migration scenarios)
    const userByEmail = await this.getUserByEmail(email);
    if (userByEmail) {
      // Update existing user with Firebase UID
      return await prisma.user.update({
        where: { id: userByEmail.id },
        data: { firebaseUid, name: name || userByEmail.name }
      });
    }

    // Create new user
    return await prisma.user.create({
      data: {
        firebaseUid,
        email,
        name: name || null
      }
    });
  }

  /**
   * Get or create user from Firebase token
   * This is the main method to use in API endpoints
   */
  async syncUser(decodedToken: DecodedIdToken): Promise<User> {
    return await this.createOrUpdateUser(decodedToken);
  }
}

// Export as singleton
export const authService = new AuthService();
export default authService;
