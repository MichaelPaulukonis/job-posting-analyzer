import type { SavedAnalysis, CoverLetter, ServiceName } from '../types';
import type { CoverLetterConversation } from '../types/conversation';
import { StorageService } from './StorageService';
import { useAuth } from '~/composables/useAuth'; // Adjust path if needed

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

  private static async getAuthHeaderAsync() {
    try {
      const { getIdToken } = useAuth();
      const token = await getIdToken();
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
      }
    }
    return {};
  }

  private static async fetchWithBaseUrl(path: string, options?: RequestInit) {
    const baseUrl = CoverLetterService.getBaseUrl();
    const url = `${baseUrl}${path}`;
    const authHeader = await CoverLetterService.getAuthHeaderAsync();
    options = options || {};
    options.headers = {
      ...(options.headers || {}),
      ...authHeader,
    };
    return fetch(url, options);
  }

  /**
   * Generate a cover letter based on analysis results
   */
  static async generateCoverLetter(
    analysis: SavedAnalysis,
    conversationId?: string,
    sampleLetter?: string,
    instructions?: string,
    referenceContent?: string,
    serviceName?: ServiceName
  ): Promise<{ coverLetter: CoverLetter; conversation: CoverLetterConversation }> {
    try {
      const isNewConversation = !conversationId;
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
          isNewConversation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error generating cover letter');
      }

      const result = await response.json();

      const coverLetter: CoverLetter = {
        content: result.currentContent,
        timestamp: result.updatedAt,
        conversationId: result.id,
        sampleContent: sampleLetter,
        instructions,
        history: [],
        editedSections: [],
      };

      return { coverLetter, conversation: result };
    } catch (error) {
      console.error('Cover letter service error:', error);
      throw error;
    }
  }
}
