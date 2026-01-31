import type { CoverLetterConversation } from '~/types/conversation';
import conversationRepository from '../../repositories/ConversationRepository';
import { requireAuth } from '~/server/utils/verifyToken';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const method = getMethod(event);
  
  switch (method) {
    case 'GET':
      try {
        const query = getQuery(event);
        const { analysisId } = query;
        
        let conversations: CoverLetterConversation[];
        if (analysisId && typeof analysisId === 'string') {
          // Get conversations for a specific analysis
          console.log(`[API] Fetching conversations for analysisId: ${analysisId}`);
          conversations = conversationRepository.getByAnalysisId(analysisId);
          console.log(`[API] Found ${conversations.length} conversations for analysisId: ${analysisId}`);
        } else {
          // Get all conversations
          console.log('[API] Fetching all conversations');
          conversations = conversationRepository.getAll();
          console.log(`[API] Found ${conversations.length} total conversations`);
        }
        
        // Ensure we always return an array
        if (!Array.isArray(conversations)) {
          console.error('[API] ERROR: Repository returned non-array:', typeof conversations, conversations);
          return [];
        }
        
        return conversations;
      } catch (error) {
        console.error('[API] Error retrieving conversations:', error);
        console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
