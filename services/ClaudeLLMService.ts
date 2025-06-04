import type { AnalysisResult, JobPosting, Resume } from '../types';
import type { LLMServiceInterface } from './LLMServiceInterface';
import { createAnalysisPrompt } from '../utils/promptUtils';
import { anthropic } from '@ai-sdk/anthropic';
import { BaseLLMService } from './BaseLLMService';
import { generateText } from 'ai';
import { useRuntimeConfig } from '#app';

export class ClaudeLLMService extends BaseLLMService implements LLMServiceInterface {
  // private claude: anthropic;
  private model: string;
  
  constructor(apiKey: string, model: string = 'claude-3-7-sonnet-20250219') {
    super();
    // this.claude = new anthropic({ apiKey });
    this.model = model;
  }
  
  async analyzeJobPosting(jobPosting: JobPosting, resume: Resume): Promise<AnalysisResult> {
    try {
      const prompt = createAnalysisPrompt(jobPosting, resume);
      
      // Generate content using AI SDK
      const response = await generateText({
        // model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000
      });
      
      // Access the text content from the response
      const text = response.content[0]?.text || '';
      
      // Process the response using the base class method
      return this.parseResponseText(text);
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw new Error('Failed to analyze job posting using Claude AI');
    }
  }
  
  getServiceName(): string {
    return 'Anthropic Claude';
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      // ONLY check the public flag that indicates if the service is available
      // NEVER reference the actual API key in client-side code
      const config = useRuntimeConfig();
      return !!config.public.anthropicApiAvailable;
    } catch (error) {
      console.error('Error checking Claude availability:', error);
      return false;
    }
  }
}
