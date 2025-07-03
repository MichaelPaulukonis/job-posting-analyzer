import type { SavedAnalysis, CoverLetter, ServiceName } from '../types';
import type { CoverLetterConversation } from '../types/conversation';
import { StorageService } from './StorageService';

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
    serviceName?: ServiceName
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
          serviceName,
          isNewConversation: true
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
        conversationId: result.conversationId,
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
    conversationId: string,
    sampleLetter?: string,
    instructions?: string,
    referenceContent?: string,
    serviceName?: ServiceName
  ): Promise<{ coverLetter: CoverLetter; conversation: CoverLetterConversation }> {
    try {
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
          serviceName,
          conversationId,
          isNewConversation: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error generating cover letter');
      }

      const result = await response.json();

      const coverLetter: CoverLetter = {
        content: result.content,
        timestamp: result.timestamp,
        conversationId: result.conversationId,
        sampleContent: sampleLetter,
        instructions,
        history: [],
        editedSections: [],
      };

      const updatedConversation = await StorageService.getConversation(result.conversationId);

      if (!updatedConversation) {
        throw new Error(`Failed to retrieve conversation with id: ${result.conversationId}`);
      }

      return { coverLetter, conversation: updatedConversation };
    } catch (error) {
      console.error('Cover letter service error:', error);
      throw error;
    }
  }
}
