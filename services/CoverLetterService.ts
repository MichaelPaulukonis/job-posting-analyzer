import type { SavedAnalysis, CoverLetter, ServiceName } from '../types';

export class CoverLetterService {
  private static getBaseUrl() {
    // In development, use the current origin
    if (process.dev) {
      return window.location.origin;
    }
    // In production, use the configured base URL or fallback to current origin
    return process.env.NUXT_PUBLIC_API_BASE || window.location.origin;
  }

  private static async fetchWithBaseUrl(path: string, options?: RequestInit) {
    const baseUrl = this.getBaseUrl();
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
      const response = await this.fetchWithBaseUrl('/api/cover-letter/generate', {
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
}
