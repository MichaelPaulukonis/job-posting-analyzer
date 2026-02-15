import { defineEventHandler, getQuery } from 'h3';
import { requireAuth } from '~/server/utils/verifyToken';
import { prisma } from '~/server/utils/prisma';

/**
 * GET /api/analysis
 * Retrieves all analysis results for the authenticated user
 * Query params:
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 *   - resumeId: string (optional filter)
 *   - jobPostingId: string (optional filter)
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event);

    console.log('[API] GET /api/analysis - user:', user?.id || 'anonymous');

    const query = getQuery(event);
    const limit = Math.min(parseInt(query.limit as string) || 50, 100);
    const offset = parseInt(query.offset as string) || 0;
    const resumeId = query.resumeId as string | undefined;
    const jobPostingId = query.jobPostingId as string | undefined;

    // Build where clause
    const where: any = {};
    
    // Only filter by userId if user is authenticated
    if (user?.id) {
      where.resume = {
        userId: user.id
      };
      console.log('[API] Filtering by userId:', user.id);
    } else {
      console.log('[API] No user filter (auth disabled)');
    }

    if (resumeId) {
      where.resumeId = resumeId;
    }

    if (jobPostingId) {
      where.jobPostingId = jobPostingId;
    }

    // Fetch analysis results
    const [analysisResults, total] = await Promise.all([
      prisma.analysisResult.findMany({
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
              content: true
            }
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
              company: true,
              content: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.analysisResult.count({ where })
    ]);

    console.log('[API] Found', analysisResults.length, 'analyses, total:', total);
    if (analysisResults.length > 0) {
      console.log('[API] First analysis ID:', analysisResults[0].id);
      console.log('[API] First analysis has resume:', !!analysisResults[0].resume);
      console.log('[API] First analysis has jobPosting:', !!analysisResults[0].jobPosting);
    }

    const response = {
      analysisResults,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };

    return response;
  } catch (error) {
    console.error('[API] Error in GET /api/analysis:', error);
    // Return empty array instead of throwing to prevent null responses
    return {
      analysisResults: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    };
  }
});
