import { GoogleGenerativeAI } from '@google/generative-ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createCoverLetterPrompt } from '~/utils/promptUtils';
import type { SavedAnalysis, ServiceName } from '~/types';
import { generateText } from 'ai';

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { analysis, sampleLetter, instructions, referenceContent, serviceName } = body as {
      analysis: SavedAnalysis;
      sampleLetter?: string;
      instructions?: string;
      referenceContent?: string;
      serviceName?: ServiceName;
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
    });

    let generatedText: string = '';
    const { systemInstruction, userPrompt } = createCoverLetterPrompt(analysis, sampleLetter, instructions, referenceContent);

    switch (selectedServiceName) {
      case 'gemini':
        if (!config.geminiApiKey) throw new Error('Gemini API key is not configured');
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        const model = genAI.getGenerativeModel({ 
          model: config.geminiModel || 'gemini-pro',
        });
        const fullPromptForGemini = systemInstruction ? `${systemInstruction}\n\n${userPrompt}` : userPrompt;
        const result = await model.generateContent(fullPromptForGemini);
        generatedText = result.response.text();
        break;
      case 'anthropic':
        if (!config.anthropicApiKey) throw new Error('Anthropic API key is not configured');
        const claudeLanguageModel = anthropic(config.anthropicModel || "claude-3-haiku-20240307");
        const { text: claudeText } = await generateText({
          model: claudeLanguageModel,
          system: systemInstruction,
          prompt: userPrompt,
          maxTokens: 2048,
        });
        generatedText = claudeText;
        break;
      case 'mock':
        generatedText = `Mock cover letter for ${analysis.jobTitle}.\nSystem: ${systemInstruction}\nPrompt: ${userPrompt}`;
        break;
      default:
        throw new Error(`Unsupported LLM service: ${selectedServiceName}`);
    }

    console.log('Cover letter generated successfully');
    return {
      content: generatedText,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error in cover letter generation API:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Error generating cover letter'
    });
  }
});
