import { requireAuth } from '~/server/utils/verifyToken';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Resume ID is required'
    });
  }
  
  // GET request to retrieve a specific resume
  if (method === 'GET') {
    const where: any = { id };
    if (user?.id) {
      where.userId = user.id;
    }
    
    const resume = await prisma.resume.findFirst({
      where,
      select: {
        id: true,
        name: true,
        content: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!resume) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Resume not found or does not belong to user'
      });
    }

    return resume;
  }
  
  // DELETE request to remove a specific resume
  if (method === 'DELETE') {
    // Verify resume belongs to user before deleting
    const where: any = { id };
    if (user?.id) {
      where.userId = user.id;
    }
    
    const resume = await prisma.resume.findFirst({
      where
    });

    if (!resume) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Resume not found or does not belong to user'
      });
    }

    await prisma.resume.delete({
      where: { id }
    });

    return { success: true };
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  });
});