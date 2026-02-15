import { defineEventHandler, getRouterParam } from 'h3';
import { requireAuth } from '~/server/utils/verifyToken';
import { prisma } from '~/server/utils/prisma';

/**
 * GET /api/analysis/:id
 * Retrieves a specific analysis result by ID
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event);

    const id = getRouterParam(event, 'id');

    console.log('[API] GET /api/analysis/:id - id:', id, 'user:', user?.id || 'anonymous');

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Analysis ID is required'
      });
    }

    // Fetch analysis result with related data
    const where: any = { id };
    
    // Only filter by userId if user is authenticated
    if (user?.id) {
      where.resume = {
        userId: user.id
      };
      console.log('[API] Filtering by userId:', user.id);
    } else {
      console.log('[API] No user filter (auth disabled)');
    }
    
    const analysisResult = await prisma.analysisResult.findFirst({
      where,
      select: {
        id: true,
        resumeId: true,
        jobPostingId: true,
        matches: true,
        gaps: true,
        suggestions: true,
        similarityScore: true,
        analysisMetadata: true,
        createdAt: true,
        updatedAt: true,
        resume: {
          select: {
            id: true,
            name: true,
            content: true,
            metadata: true,
            createdAt: true
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            company: true,
            content: true,
            url: true,
            location: true,
            salaryRange: true,
            metadata: true,
            createdAt: true
          }
        }
      }
    });

    if (!analysisResult) {
      console.log('[API] Analysis not found:', id);
      throw createError({
        statusCode: 404,
        statusMessage: 'Analysis result not found or does not belong to user'
      });
    }

    console.log('[API] Found analysis:', analysisResult.id);
    console.log('[API] Has resume:', !!analysisResult.resume);
    console.log('[API] Has jobPosting:', !!analysisResult.jobPosting);

    return analysisResult;
  } catch (error) {
    console.error('[API] Error in GET /api/analysis/:id:', error);
    throw error;
  }
});
