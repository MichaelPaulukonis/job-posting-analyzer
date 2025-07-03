import type { CoverLetterConversation } from '~/types/conversation';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  switch (method) {
    case 'GET':
      // For now, return empty array since we don't have persistent storage
      // In a real app, this would query a database
      return [];
      
    case 'POST':
      try {
        const conversation = await readBody(event) as CoverLetterConversation;
        
        // Validate conversation
        if (!conversation.id || !conversation.analysisId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Invalid conversation data'
          });
        }
        
        // For now, just return success since we don't have persistent storage
        // In a real app, this would save to a database
        console.log(`Conversation ${conversation.id} would be saved for analysis ${conversation.analysisId}`);
        
        return { success: true, id: conversation.id };
      } catch (error) {
        console.error('Error saving conversation:', error);
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save conversation'
        });
      }
      
    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      });
  }
});
