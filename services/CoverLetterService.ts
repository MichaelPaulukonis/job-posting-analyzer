import type { SavedAnalysis, CoverLetter, ServiceName } from '../types';
import type { CoverLetterConversation, ConversationMessage } from '../types/conversation';
import { StorageService } from './StorageService';
import { 
  formatConversationForAI,
  addMessageToConversation,
  createCoverLetterConversation,
  conversationToContext
} from '../utils/conversationUtils';

export class CoverLetterService {
  private static getBaseUrl() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    // On server-side, try to get runtime config
    try {
      const config = useRuntimeConfig();
      return config.public.baseUrl || 'http://localhost:3000';
    } catch {
      // Fallback for non-Nuxt environments (like tests)
      return process.env.BASE_URL || 'http://localhost:3000';
    }
  }

  private static async fetchWithBaseUrl(path: string, options?: RequestInit) {
    const baseUrl = CoverLetterService.getBaseUrl();
    const url = `${baseUrl}${path}`;
    return fetch(url, options);
  }

  /**
   * Generate a cover letter based on analysis results
   */
  static async generateCoverLetter(
    analysis: SavedAnalysis, 
    sampleLetter?: string,
    instructions?: string,
    referenceContent?: string,
    serviceName?: ServiceName // Add serviceName parameter
  ): Promise<CoverLetter> {
    try {
      // Call our server API endpoint
      const response = await CoverLetterService.fetchWithBaseUrl('/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis,
          sampleLetter,
          instructions,
          referenceContent,
          serviceName // Pass serviceName to the API endpoint
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error generating cover letter');
      }
      
      const result = await response.json();
      return {
        content: result.content,
        timestamp: result.timestamp,
        sampleContent: sampleLetter,
        instructions,
        history: [],
        editedSections: []
      };
    } catch (error) {
      console.error('Cover letter service error:', error);
      throw error;
    }
  }

  /**
   * Generate a cover letter with conversation context
   */
  static async generateCoverLetterWithContext(
    analysis: SavedAnalysis,
    conversationId?: string,
    sampleLetter?: string,
    instructions?: string,
    referenceContent?: string,
    serviceName?: ServiceName
  ): Promise<{ coverLetter: CoverLetter; conversation: CoverLetterConversation }> {
    try {
      let conversation: CoverLetterConversation;
      
      if (conversationId) {
        // Load existing conversation
        const existingConversation = await StorageService.getConversation(conversationId);
        if (existingConversation) {
          conversation = existingConversation;
        } else {
          // Create new conversation if the provided ID doesn't exist
          conversation = await CoverLetterService.createNewConversation(analysis.id, sampleLetter, instructions, referenceContent);
        }
      } else {
        // Create new conversation
        conversation = await CoverLetterService.createNewConversation(analysis.id, sampleLetter, instructions, referenceContent);
      }
      
      // Add user request to conversation
      const userMessage: ConversationMessage = {
        role: 'user',
        content: instructions || 'Please generate a cover letter for this position.',
        timestamp: new Date().toISOString(),
        metadata: {
          instructions,
          sampleLetter,
          referenceContent
        }
      };
      
      conversation = addMessageToConversation(conversation, userMessage);
      
      // Format conversation context for AI
      const conversationContext = conversationToContext(
        conversation,
        analysis,
        sampleLetter,
        instructions,
        referenceContent
      );
      
      // Call API with conversation context
      const response = await CoverLetterService.fetchWithBaseUrl('/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis,
          conversationContext: formatConversationForAI(conversationContext),
          serviceName
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error generating cover letter');
      }
      
      const result = await response.json();
      
      // Add AI response to conversation
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: result.content,
        timestamp: result.timestamp
      };
      
      conversation = addMessageToConversation(conversation, assistantMessage);
      conversation.currentContent = result.content;
      conversation.updatedAt = result.timestamp;
      
      // Save updated conversation
      await StorageService.saveConversation(conversation);
      
      // Link conversation to analysis if not already linked
      if (analysis.conversationId !== conversation.id) {
        await StorageService.linkConversationToAnalysis(analysis.id, conversation.id);
      }
      
      const coverLetter: CoverLetter = {
        content: result.content,
        timestamp: result.timestamp,
        conversationId: conversation.id,
        sampleContent: sampleLetter,
        instructions,
        history: [],
        editedSections: []
      };
      
      return { coverLetter, conversation };
      
    } catch (error) {
      console.error('Cover letter service error:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation for cover letter generation
   */
  private static async createNewConversation(
    analysisId: string,
    sampleLetter?: string,
    instructions?: string,
    referenceContent?: string
  ): Promise<CoverLetterConversation> {
    // Add system message
    const systemMessage: ConversationMessage = {
      role: 'system',
      content: 'You are a professional cover letter writer. You help job seekers create compelling, personalized cover letters based on their resume analysis and job requirements.',
      timestamp: new Date().toISOString(),
      metadata: {
        instructions,
        sampleLetter,
        referenceContent
      }
    };
    
    const newConversation = createCoverLetterConversation(analysisId, systemMessage);
    
    return newConversation;
  }
}
