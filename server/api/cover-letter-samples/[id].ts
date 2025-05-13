import coverLetterSampleRepository from '../../repositories/CoverLetterSampleRepository';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;
  
  // DELETE request to remove a specific sample
  if (method === 'DELETE') {
    try {
      coverLetterSampleRepository.delete(id);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting cover letter sample with ID ${id}:`, error);
      throw createError({
        statusCode: 500,
        message: 'Error deleting cover letter sample'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});