import analysisRepository from '../../repositories/AnalysisRepository';
import { requireAuth } from '~/server/utils/verifyToken';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const method = event.method;
  
  // GET request to retrieve all analyses
  if (method === 'GET') {
    try {
      console.log('[API] Fetching all analyses...');
      const analyses = analysisRepository.getAll();
      console.log(`[API] Retrieved ${analyses.length} analyses`);
      
      // Ensure we always return an array
      if (!Array.isArray(analyses)) {
        console.error('[API] ERROR: Repository returned non-array:', typeof analyses, analyses);
        return [];
      }
      
      return analyses;
    } catch (error) {
      console.error('[API] Error reading storage:', error);
      console.error('[API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[API] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw createError({
        statusCode: 500,
        message: 'Error reading storage data'
      });
    }
  }
  
  // POST request to save data
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      analysisRepository.saveAll(body);
      return { success: true };
    } catch (error) {
      console.error('Error saving storage:', error);
      throw createError({
        statusCode: 500,
        message: 'Error saving storage data'
      });
    }
  }
  
  // DELETE request to clear all data
  if (method === 'DELETE') {
    try {
      analysisRepository.clear();
      return { success: true };
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw createError({
        statusCode: 500,
        message: 'Error clearing storage data'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});
