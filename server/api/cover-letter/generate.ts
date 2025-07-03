import { GoogleGenerativeAI } from '@google/generative-ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createCoverLetterPrompt } from '~/utils/promptUtils';
import { createCoverLetterConversation, addMessageToConversation, formatCoverLetterConversationForAI } from '~/utils/conversationUtils';
import { StorageService } from '~/services/StorageService';
import type { SavedAnalysis, ServiceName } from '~/types';
import type { CoverLetterConversation, ConversationMessage } from '~/types/conversation';
import { generateText } from 'ai';

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { 
      analysis, 
      sampleLetter, 
      instructions, 
      referenceContent, 
      serviceName,
      conversationId,
      isNewConversation 
    } = body as {
      analysis: SavedAnalysis;
      sampleLetter?: string;
      instructions?: string;
      referenceContent?: string;
      serviceName?: ServiceName;
      conversationId?: string;
      isNewConversation?: boolean;
    };

    if (!analysis) {
      throw createError({
        statusCode: 400,
        message: 'Missing analysis data'
      });
    }

    const selectedServiceName = serviceName || 'gemini';

    console.log(`Generating cover letter using ${selectedServiceName} for analysis:`, {
      jobTitle: analysis.jobTitle,
      conversationId,
      isNewConversation
    });

    // Handle conversation context
    let conversation: CoverLetterConversation;
    
    if (conversationId && !isNewConversation) {
      // Continue existing conversation
      const existingConversation = await StorageService.getConversation(conversationId);
      if (!existingConversation) {
        throw createError({
          statusCode: 404,
          message: 'Conversation not found'
        });
      }
      conversation = existingConversation;
    } else {
      // Create new conversation
      conversation = createCoverLetterConversation(analysis.id);
    }

    // Create conversation messages
    let generatedText: string = '';
    const { systemInstruction, userPrompt } = createCoverLetterPrompt(analysis, sampleLetter, instructions, referenceContent);

    // Add system message if this is a new conversation
    if (!conversationId || isNewConversation) {
      conversation = addMessageToConversation(conversation, {
        role: 'system',
        content: systemInstruction,
        timestamp: new Date().toISOString()
      });
    }

    // Add user message
    const userMessage: ConversationMessage = {
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toISOString()
    };
    
    if (instructions || referenceContent) {
      userMessage.metadata = {
        instructions: instructions || undefined,
        referenceContent: referenceContent || undefined
      };
    }

    conversation = addMessageToConversation(conversation, userMessage);

    // Format conversation for the LLM
    const formattedMessages = formatCoverLetterConversationForAI(conversation);

    switch (selectedServiceName) {
      case 'gemini': {
        if (!config.geminiApiKey) throw new Error('Gemini API key is not configured');
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        const model = genAI.getGenerativeModel({ 
          model: config.geminiModel || 'gemini-pro',
        });
        // Combine all messages for Gemini
        const fullPromptForGemini = [
          formattedMessages.systemInstruction,
          ...formattedMessages.messages.map(m => `${m.role}: ${m.content}`)
        ].join('\n\n');
        console.log(JSON.stringify(fullPromptForGemini))
        const result = await model.generateContent(fullPromptForGemini);
        generatedText = result.response.text();
        break;
      }
      case 'anthropic': {
        if (!config.anthropicApiKey) throw new Error('Anthropic API key is not configured');
        const claudeLanguageModel = anthropic(config.anthropicModel || "claude-3-haiku-20240307");
        const { text: claudeText } = await generateText({
          model: claudeLanguageModel,
          system: formattedMessages.systemInstruction,
          messages: formattedMessages.messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })),
          maxTokens: 2048,
        });
        generatedText = claudeText;
        break;
      }
      case 'mock': {
        generatedText = `Mock cover letter for ${analysis.jobTitle}.\nConversation length: ${conversation.messages.length} messages`;
        break;
      }
      default:
        throw new Error(`Unsupported LLM service: ${selectedServiceName}`);
    }

    // Add the assistant response to the conversation
    conversation = addMessageToConversation(conversation, {
      role: 'assistant',
      content: generatedText,
      timestamp: new Date().toISOString()
    });

    // Update the current content
    conversation.currentContent = generatedText;
    conversation.updatedAt = new Date().toISOString();

    // Save the conversation
    await StorageService.saveConversation(conversation);

    // Link conversation to analysis if not already linked
    if (analysis.conversationId !== conversation.id) {
      await StorageService.linkConversationToAnalysis(analysis.id, conversation.id);
    }

    console.log('Cover letter generated successfully');
    return {
      content: generatedText,
      conversationId: conversation.id,
      timestamp: new Date().toISOString()
    };

  } catch (error: unknown) {
    console.error('Error in cover letter generation API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error generating cover letter';
    throw createError({
      statusCode: 500,
      message: errorMessage
    });
  }
});
