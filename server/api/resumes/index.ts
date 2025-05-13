import resumeRepository from '../../repositories/ResumeRepository';

export default defineEventHandler(async (event) => {
  const method = event.method;
  
  // GET request to retrieve all resumes
  if (method === 'GET') {
    try {
      return resumeRepository.getAll();
    } catch (error) {
      console.error('Error reading resumes:', error);
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