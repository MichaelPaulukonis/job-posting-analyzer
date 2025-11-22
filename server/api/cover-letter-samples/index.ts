import coverLetterSampleRepository from '../../repositories/CoverLetterSampleRepository';
import { requireAuth } from '~/server/utils/verifyToken';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const method = event.method;
  
  // GET request to retrieve all samples
  if (method === 'GET') {
    try {
      return coverLetterSampleRepository.getAll();
    } catch (error) {
      console.error('Error reading cover letter samples:', error);
      throw createError({
        statusCode: 500,
        message: 'Error reading cover letter samples data'
      });
    }
  }
  
  // POST request to save data
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      coverLetterSampleRepository.saveAll(body);
      return { success: true };
    } catch (error) {
      console.error('Error saving cover letter samples:', error);
      throw createError({
        statusCode: 500,
        message: 'Error saving cover letter samples data'
      });
    }
  }
  
  // DELETE request to clear all data
  if (method === 'DELETE') {
    try {
      coverLetterSampleRepository.clear();
      return { success: true };
    } catch (error) {
      console.error('Error clearing cover letter samples:', error);
      throw createError({
        statusCode: 500,
        message: 'Error clearing cover letter samples data'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});