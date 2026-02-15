import { defineEventHandler, getQuery } from 'h3';
import { requireAuth } from '~/server/utils/verifyToken';
import { prisma } from '~/server/utils/prisma';

/**
 * GET /api/resumes
 * Retrieves all resumes for the authenticated user
 * Query params:
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 *   - name: string (optional filter)
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event);

  const query = getQuery(event);
  const limit = Math.min(parseInt(query.limit as string) || 50, 100);
  const offset = parseInt(query.offset as string) || 0;
  const name = query.name as string | undefined;

  // Build where clause
  const where: any = {};
  
  // Only filter by userId if user is authenticated
  if (user?.id) {
    where.userId = user.id;
  }

  if (name) {
    where.name = {
      contains: name,
      mode: 'insensitive'
    };
  }

  // Fetch resumes
  const [resumes, total] = await Promise.all([
    prisma.resume.findMany({
      where,
      select: {
        id: true,
        name: true,
        content: true,
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
    prisma.resume.count({ where })
  ]);

  return {
    resumes,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };
});
