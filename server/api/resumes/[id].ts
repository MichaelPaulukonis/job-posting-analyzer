import resumeRepository from '../../repositories/ResumeRepository';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;
  
  // DELETE request to remove a specific resume
  if (method === 'DELETE') {
    try {
      resumeRepository.delete(id!);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting resume with ID ${id}:`, error);
      throw createError({
        statusCode: 500,
        message: 'Error deleting resume'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});