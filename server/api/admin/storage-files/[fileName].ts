import { requireAuth } from '~/server/utils/verifyToken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin endpoint to query database tables
 * Maps old JSON file names to Prisma models
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event);
    const fileName = getRouterParam(event, 'fileName');
    
    if (!fileName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File name is required',
      });
    }
    
    // Basic security check
    if (fileName.includes('..') || !fileName.endsWith('.json')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file name',
      });
    }
    
    // Map file names to Prisma models
    let data: any[] = [];
    
    switch (fileName) {
      case 'resumes.json':
        data = await prisma.resume.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit to prevent large responses
        });
        break;
        
      case 'job-postings.json':
        data = await prisma.jobPosting.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        break;
        
      case 'analysis-results.json':
        data = await prisma.analysisResult.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            resume: { select: { name: true } },
            jobPosting: { select: { title: true, company: true } },
          },
        });
        break;
        
      case 'cover-letters.json':
        data = await prisma.coverLetter.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            resume: { select: { name: true } },
            jobPosting: { select: { title: true, company: true } },
          },
        });
        break;
        
      case 'conversations.json':
        data = await prisma.conversation.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            resume: { select: { name: true } },
            jobPosting: { select: { title: true, company: true } },
          },
        });
        break;
        
      case 'users.json':
        data = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        break;
        
      default:
        throw createError({
          statusCode: 404,
          statusMessage: `Table not found: ${fileName}`,
        });
    }
    
    return data;
  } catch (error) {
    console.error('Error querying database:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to query database',
    });
  } finally {
    await prisma.$disconnect();
  }
});
