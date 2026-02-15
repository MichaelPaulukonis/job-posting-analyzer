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
  const { user } = await requireAuth(event);

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
            name: true
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            company: true
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

  return {
    analysisResults,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };
});
