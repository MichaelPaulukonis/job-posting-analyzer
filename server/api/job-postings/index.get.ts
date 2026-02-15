import { defineEventHandler, getQuery } from 'h3';
import { requireAuth } from '~/server/utils/verifyToken';
import { prisma } from '~/server/utils/prisma';

/**
 * GET /api/job-postings
 * Retrieves all job postings for the authenticated user
 * Query params:
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 *   - company: string (optional filter)
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event);

  const query = getQuery(event);
  const limit = Math.min(parseInt(query.limit as string) || 50, 100);
  const offset = parseInt(query.offset as string) || 0;
  const company = query.company as string | undefined;

  // Build where clause
  const where: any = {};
  
  // Only filter by userId if user is authenticated
  if (user?.id) {
    where.userId = user.id;
  }

  if (company) {
    where.company = {
      contains: company,
      mode: 'insensitive'
    };
  }

  // Fetch job postings
  const [jobPostings, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      select: {
        id: true,
        title: true,
        company: true,
        content: true,
        url: true,
        location: true,
        salaryRange: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    }),
    prisma.jobPosting.count({ where })
  ]);

  return {
    jobPostings,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };
});
