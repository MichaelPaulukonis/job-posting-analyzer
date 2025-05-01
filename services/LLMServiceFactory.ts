import type { LLMServiceInterface } from './LLMServiceInterface';
import { MockLLMService } from './MockLLMService';
import { GeminiLLMService } from './GeminiLLMService';

// This factory will make it easier to switch between different LLM implementations later
export class LLMServiceFactory {
  static createService(type: 'mock' | 'gemini' | 'openai' = 'mock'): LLMServiceInterface {
    switch (type) {
      case 'mock':
        return new MockLLMService();
      case 'gemini':
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
          console.warn('Gemini API key not found, using mock service instead');
          return new MockLLMService();
        }
        return new GeminiLLMService(geminiApiKey, process.env.GEMINI_MODEL || 'gemini-pro');
      case 'openai':
        // For future implementation
        console.warn('OpenAI service not implemented yet, using mock service instead');
        return new MockLLMService();
      default:
        return new MockLLMService();
    }
  }
}
