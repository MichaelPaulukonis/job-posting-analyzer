import type { SavedAnalysis, CoverLetter } from '../types';

export class CoverLetterService {
  /**
   * Generate a cover letter based on analysis results
   */
  static async generateCoverLetter(analysis: SavedAnalysis, sampleLetter?: string): Promise<CoverLetter> {
    try {
      // Call our server API endpoint
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis,
          sampleLetter,
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
        sampleContent: sampleLetter
      };
    } catch (error) {
      console.error('Cover letter service error:', error);
      throw error;
    }
  }
}
