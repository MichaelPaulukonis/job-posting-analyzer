import { GoogleGenerativeAI } from '@google/generative-ai';
import { createCoverLetterPrompt } from '~/utils/promptUtils';

export default defineEventHandler(async (event) => {
  try {
    // Get runtime config with API keys (server side only)
    const config = useRuntimeConfig();
    
    // Check if API key is available
    if (!config.geminiApiKey) {
      console.log('API key missing: Gemini API key is not configured');
      throw new Error('Gemini API key is not configured');
    }
    
    // Parse request body
    const body = await readBody(event);
    const { analysis, sampleLetter, instructions, referenceContent } = body;
    
    if (!analysis) {
      throw createError({
        statusCode: 400,
        message: 'Missing analysis data'
      });
    }
    
    console.log('Generating cover letter for analysis:', {
      jobTitle: analysis.jobTitle,
      matches: analysis.matches.length,
      gaps: analysis.gaps.length,
      hasInstructions: !!instructions,
      hasReference: !!referenceContent
    });
    
    // Initialize Gemini client
    const ai = new GoogleGenerativeAI(config.geminiApiKey);
    const model = ai.getGenerativeModel({ model: config.geminiModel });
    
    // Generate prompt
    const prompt = createCoverLetterPrompt(analysis, sampleLetter, instructions, referenceContent);
    console.log('Generated prompt for cover letter:', prompt);
    
    // Call Gemini API
    console.log('Calling Gemini API for cover letter generation...');
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const endTime = Date.now();
    console.log(`Gemini API response received in ${endTime - startTime}ms`);
    
    const response = result.response;
    const text = response.text();
    console.log('Cover letter generated successfully');
    
    // Return the generated cover letter
    return {
      content: text,
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
