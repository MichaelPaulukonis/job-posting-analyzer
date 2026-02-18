import { requireAuth } from '~/server/utils/verifyToken';

/**
 * Admin endpoint to list available database tables
 * Returns a list of table names that can be queried
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event);
    
    // Return list of available tables (matching the old JSON file names)
    const tables = [
      'resumes.json',
      'job-postings.json',
      'analysis-results.json',
      'cover-letters.json',
      'conversations.json',
      'users.json'
    ];
    
    return tables;
  } catch (error) {
    console.error('Error listing tables:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to list tables',
    });
  }
});
