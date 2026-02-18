import { requireAuth } from '~/server/utils/verifyToken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin endpoint to create sample data in the database
 * Creates a sample resume for testing purposes
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event);
    
    // Create a sample resume
    const sampleResume = await prisma.resume.create({
      data: {
        name: 'Sample Resume',
        content: 'This is a sample resume created for testing the admin interface.',
        metadata: {
          source: 'admin-sample',
          createdBy: 'admin',
          items: [
            { id: 1, name: 'Item 1', value: 'Value 1' },
            { id: 2, name: 'Item 2', value: 'Value 2' },
            { id: 3, name: 'Item 3', value: 'Value 3' }
          ]
        },
      },
    });
    
    return { 
      success: true, 
      message: 'Sample data created successfully', 
      data: sampleResume,
      fileName: 'resumes.json' // For compatibility with admin interface
    };
  } catch (error) {
    console.error('Error creating sample data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create sample data',
    });
  } finally {
    await prisma.$disconnect();
  }
});
