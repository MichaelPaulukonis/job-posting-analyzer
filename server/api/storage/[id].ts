import analysisRepository from '../../repositories/AnalysisRepository';
import { requireAuth } from '~/server/utils/verifyToken';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
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
