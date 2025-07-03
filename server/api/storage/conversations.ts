import type { CoverLetterConversation } from '~/types/conversation';
import conversationRepository from '../../repositories/ConversationRepository';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  switch (method) {
    case 'GET':
      try {
        const query = getQuery(event);
        const { analysisId } = query;
        
        if (analysisId && typeof analysisId === 'string') {
          // Get conversations for a specific analysis
          return conversationRepository.getByAnalysisId(analysisId);
        } else {
          // Get all conversations
          return conversationRepository.getAll();
        }
      } catch (error) {
        console.error('Error retrieving conversations:', error);
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to retrieve conversations'
        });
      }
      
    case 'POST':
      try {
        const conversation = await readBody(event) as CoverLetterConversation;
        
        // Validate conversation
        if (!conversation.id || !conversation.analysisId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Invalid conversation data - missing id or analysisId'
          });
        }
        
        // Save conversation to file-based storage
        conversationRepository.save(conversation);
        
        console.log(`Conversation ${conversation.id} saved for analysis ${conversation.analysisId}`);
        
        return { success: true, id: conversation.id };
      } catch (error) {
        console.error('Error saving conversation:', error);
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save conversation'
        });
      }
      
    case 'DELETE':
      try {
        const query = getQuery(event);
        const { id } = query;
        
        if (!id || typeof id !== 'string') {
          throw createError({
            statusCode: 400,
            statusMessage: 'Missing conversation ID'
          });
        }
        
        conversationRepository.delete(id);
        console.log(`Conversation ${id} deleted`);
        
        return { success: true };
      } catch (error) {
        console.error('Error deleting conversation:', error);
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to delete conversation'
        });
      }
      
    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      });
  }
});
