import analysisRepository from '../../repositories/AnalysisRepository';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;
  
  // DELETE request to remove a specific analysis
  if (method === 'DELETE') {
    try {
      analysisRepository.delete(id);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting analysis with ID ${id}:`, error);
      throw createError({
        statusCode: 500,
        message: 'Error deleting analysis'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});
