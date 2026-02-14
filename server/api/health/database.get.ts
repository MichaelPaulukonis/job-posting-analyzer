/**
 * Database Health Check Endpoint
 * 
 * Tests database connectivity and returns basic statistics
 * 
 * GET /api/health/database
 */

import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Test database connection with a simple query
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`
    
    // Get table counts
    const [
      userCount,
      resumeCount,
      jobPostingCount,
      analysisCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.jobPosting.count(),
      prisma.analysisResult.count(),
    ])
    
    return {
      status: 'healthy',
      database: {
        connected: true,
        version: result[0]?.version || 'unknown',
      },
      statistics: {
        users: userCount,
        resumes: resumeCount,
        jobPostings: jobPostingCount,
        analyses: analysisCount,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    // Return error details for debugging
    return {
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    }
  }
})
