import type { AnalysisResult, JobPosting, Resume } from '../types';
import { MockLLMService } from './MockLLMService';
import { GeminiLLMService } from './GeminiLLMService';
import { ClaudeLLMService } from './ClaudeLLMService';
import type { LLMServiceInterface } from './LLMServiceInterface';

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
   * Get the appropriate LLM service instance
   */
  private static getLLMService(service: 'mock' | 'gemini' | 'openai' | 'anthropic'): LLMServiceInterface {
    switch (service) {
      case 'mock':
        return new MockLLMService();
      case 'gemini':
        return new GeminiLLMService();
      case 'anthropic':
        return new ClaudeLLMService();
      case 'openai':
        // TODO: Implement OpenAI service
        throw new Error('OpenAI service not yet implemented');
      default:
        throw new Error(`Unknown LLM service: ${service}`);
    }
  }

  /**
   * Check if a service is available
   */
  static async isServiceAvailable(service: 'mock' | 'gemini' | 'openai' | 'anthropic'): Promise<boolean> {
    try {
      // Get the appropriate service instance and delegate the availability check
      const llmService = this.getLLMService(service);
      return await llmService.isAvailable();
    } catch (error) {
      console.error(`Error checking availability for ${service}:`, error);
      return false;
    }
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
