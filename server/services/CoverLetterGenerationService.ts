import { GoogleGenerativeAI } from '@google/generative-ai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { SavedAnalysis, ServiceName } from '~/types';
import type { CoverLetterConversation } from '~/types/conversation';
import { formatCoverLetterConversationForAI } from '~/utils/conversationUtils';

const config = useRuntimeConfig();

const serviceClients = {
  gemini: () => {
    if (!config.geminiApiKey) throw new Error('Gemini API key is not configured');
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    return genAI.getGenerativeModel({ model: config.geminiModel || 'gemini-pro' });
  },
  anthropic: () => {
    if (!config.anthropicApiKey) throw new Error('Anthropic API key is not configured');
    return anthropic(config.anthropicModel || 'claude-3-haiku-20240307');
  },
  mock: () => ({ generateContent: (prompt: string) => ({ response: { text: () => `Mock response for: ${prompt}` } }) }),
};

async function generateWithService(serviceName: ServiceName, conversation: CoverLetterConversation): Promise<string> {
  console.log(`Attempting to generate cover letter with ${serviceName}`);
  const formattedMessages = formatCoverLetterConversationForAI(conversation);

  try {
    switch (serviceName) {
      case 'gemini': {
        const model = serviceClients.gemini();
        const fullPromptForGemini = [
          formattedMessages.systemInstruction,
          ...formattedMessages.messages.map(m => `${m.role}: ${m.content}`)
        ].join('\n\n');
        const result = await model.generateContent(fullPromptForGemini);
        return result.response.text();
      }
      case 'anthropic': {
        const model = serviceClients.anthropic();
        const { text } = await generateText({
          model,
          system: formattedMessages.systemInstruction,
          messages: formattedMessages.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          maxTokens: 2048,
        });
        return text;
      }
      case 'mock': {
        return `Mock cover letter for analysis. Conversation length: ${conversation.messages.length} messages`;
      }
      default:
        throw new Error(`Unsupported LLM service: ${serviceName}`);
    }
  } catch (error) {
    console.error(`Error with ${serviceName}:`, error);
    throw error; // Re-throw to be caught by the caller
  }
}

export async function generateCoverLetterWithFallback(conversation: CoverLetterConversation, initialService: ServiceName): Promise<string> {
  const fallbackOrder: ServiceName[] = ['anthropic', 'gemini', 'mock'];
  const servicesToTry: ServiceName[] = [initialService, ...fallbackOrder.filter(s => s !== initialService)];

  for (const serviceName of servicesToTry) {
    try {
      return await generateWithService(serviceName, conversation);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Service ${serviceName} failed.`, errorMessage);
      if (!errorMessage.includes('Overloaded')) {
        // If it's not an overload error, fail fast
        throw error;
      }
      // If it is an overload error, the loop will try the next service
    }
  }

  throw new Error('All AI services failed to generate a cover letter.');
}
