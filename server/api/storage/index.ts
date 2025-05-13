import analysisRepository from '../../repositories/AnalysisRepository';

export default defineEventHandler(async (event) => {
  const method = event.method;
  
  // GET request to retrieve all analyses
  if (method === 'GET') {
    try {
      return analysisRepository.getAll();
    } catch (error) {
      console.error('Error reading storage:', error);
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
