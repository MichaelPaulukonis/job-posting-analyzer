import type { AnalysisResult, JobPosting, Resume } from '../types';

export class AnalysisService {
  /**
   * Analyze a job posting against a resume
   */
  static async analyzeJobPosting(
    jobPosting: JobPosting, 
    resume: Resume, 
    service: 'mock' | 'gemini' | 'openai' | 'anthropic' = 'mock'
  ): Promise<AnalysisResult> {
    try {
      // Call our server API endpoint
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobPosting,
          resume,
          service
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error analyzing job posting');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Analysis service error:', error);
      throw error;
    }
  }
  
  /**
   * Check if a service is available
   */
  static async isServiceAvailable(service: 'mock' | 'gemini' | 'openai' |'anthropic'): Promise<boolean> {
    // Mock service is always available
    if (service === 'mock') return true;
    
    // For other services, check runtime config
    const runtimeConfig = useRuntimeConfig();
    
    if (service === 'gemini') {
      return runtimeConfig.public.geminiApiAvailable;
    }
    
    // OpenAI not implemented yet
    return false;
  }
  
  /**
   * Get service name
   */
  static getServiceName(service: 'mock' | 'gemini' | 'openai' | 'anthropic'): string {
    switch (service) {
      case 'mock': return 'Mock LLM Analyzer';
      case 'gemini': return 'Google Gemini AI';
      case 'openai': return 'OpenAI';
      case 'anthropic': return 'Anthropic Claude AI';
      default: return 'Unknown Service';
    }
  }
}
