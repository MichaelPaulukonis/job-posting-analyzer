import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import MemoryService from '~/services/MemoryService';
import { StorageService } from '~/services/StorageService';
import resumeRepository from '../../repositories/ResumeRepository';

export default defineEventHandler(async (event) => {
  try {
    // Get runtime config with API keys (server side only)
    const config = useRuntimeConfig();
    
    // Parse request body
    const body = await readBody(event);
    const { jobPosting, resumeId, useMemory = false } = body;
    
    console.log(`Upwork Analysis API: Analyzing job posting with resume ${resumeId}, useMemory: ${useMemory}`);
    
    if (!jobPosting || !resumeId) {
      console.log('API Error: Missing job posting or resume ID');
      throw createError({
        statusCode: 400,
        message: 'Missing job posting or resume ID'
      });
    }

    // Get the resume content by finding it in the list
    // Use repository directly on server-side to avoid HTTP call to self
    const resumes = resumeRepository.getAll();
    console.log(`Available resumes:`, resumes.map(r => ({ id: r.id, name: r.name })));
    console.log(`Looking for resume ID: ${resumeId}`);
    
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume) {
      console.log(`Resume with ID ${resumeId} not found. Available IDs:`, resumes.map(r => r.id));
      throw createError({
        statusCode: 404,
        message: `Resume not found. Available resumes: ${resumes.map(r => r.id).join(', ')}`
      });
    }

    // Check if Anthropic API key is available
    if (!config.anthropicApiKey) {
      console.log('API key missing: Anthropic API key is not configured');
      throw createError({
        statusCode: 500,
        message: 'Anthropic API key is not configured'
      });
    }

    // Generate analysis using Claude
    const analysis = await analyzeJobSuitability(jobPosting, resume.content, useMemory, config);
    
    return {
      success: true,
      analysis: analysis
    };

  } catch (error: any) {
    console.error('Error in Upwork analysis:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to analyze job posting'
    });
  }
});

/**
 * Analyze job suitability using Claude with optional memory integration
 */
async function analyzeJobSuitability(jobPosting: string, resume: string, useMemory: boolean, config: any): Promise<string> {
  try {
    // Integrate memory service when useMemory is true
    let memoryContext = '';
    if (useMemory) {
      console.log('Memory integration requested for job analysis');
      const memoryResult = await MemoryService.getComprehensiveProfile();
      if (memoryResult.success && memoryResult.memories.length > 0) {
        memoryContext = '\n\nRelevant career information from memory:\n' + 
          MemoryService.formatMemoriesForPrompt(memoryResult.memories);
        console.log(`Retrieved ${memoryResult.memories.length} relevant memories`);
      } else {
        console.log('No memories retrieved or memory query failed:', memoryResult.error);
        memoryContext = '\n\n[Note: Memory integration requested but no relevant information found]';
      }
    }

    // Create analysis prompt
    const prompt = `Analyze this Upwork job posting for suitability based on the provided resume. Focus on job requirements, client expectations, and realistic assessment of fit.

JOB POSTING:
${jobPosting}

RESUME:
${resume}${memoryContext}

Provide a thorough analysis including:
1. **Job Requirements Analysis**: Key requirements and what the client is looking for
2. **Skill Match Assessment**: How well the resume matches the requirements (be honest)
3. **Competitive Position**: Strengths that would make this application stand out
4. **Potential Concerns**: Areas where the match might be weak or unclear
5. **Recommendation**: Whether to apply and why (consider time investment vs. probability of success)

Be realistic and honest - it's better to identify a poor fit early than waste time on unsuitable applications.`;

    console.log('Calling Claude API for job suitability analysis...');
    const startTime = Date.now();
    
    // Ensure the environment variable is set for the anthropic client
    if (config.anthropicApiKey && !process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = config.anthropicApiKey;
    }
    
    const response = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      system: "You are an expert freelance consultant helping evaluate Upwork job opportunities. Provide honest, realistic assessments that help make informed bidding decisions.",
      messages: [
        { 
          role: 'user', 
          content: prompt
        }
      ]
    });
    
    const endTime = Date.now();
    console.log(`Claude API analysis completed in ${endTime - startTime}ms`);
    
    return response.text;
    
  } catch (error: any) {
    console.error('Error in analyzeJobSuitability:', error);
    throw error;
  }
}