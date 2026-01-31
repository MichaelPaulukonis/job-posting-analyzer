import resumeRepository from '../../repositories/ResumeRepository';
import { requireAuth } from '~/server/utils/verifyToken';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const method = event.method;
  
  // GET request to retrieve all resumes
  if (method === 'GET') {
    try {
      console.log('[API] Fetching all resumes...');
      const resumes = resumeRepository.getAll();
      console.log(`[API] Retrieved ${resumes.length} resumes`);
      
      // Ensure we always return an array
      if (!Array.isArray(resumes)) {
        console.error('[API] ERROR: Repository returned non-array:', typeof resumes, resumes);
        return [];
      }
      
      return resumes;
    } catch (error) {
      console.error('[API] Error reading resumes:', error);
      console.error('[API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[API] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw createError({
        statusCode: 500,
        message: 'Error reading resumes data'
      });
    }
  }
  
  // POST request to save data
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      resumeRepository.saveAll(body);
      return { success: true };
    } catch (error) {
      console.error('Error saving resumes:', error);
      throw createError({
        statusCode: 500,
        message: 'Error saving resumes data'
      });
    }
  }
  
  // DELETE request to clear all data
  if (method === 'DELETE') {
    try {
      resumeRepository.clear();
      return { success: true };
    } catch (error) {
      console.error('Error clearing resumes:', error);
      throw createError({
        statusCode: 500,
        message: 'Error clearing resumes data'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});