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
    const { jobPosting, resumeId, analysis, useMemory = false } = body;
    
    console.log(`Upwork Proposal API: Generating proposal for resume ${resumeId}, useMemory: ${useMemory}`);
    
    if (!jobPosting || !resumeId || !analysis) {
      console.log('API Error: Missing required data');
      throw createError({
        statusCode: 400,
        message: 'Missing job posting, resume ID, or analysis data'
      });
    }

    // Get the resume content
    // Use repository directly on server-side to avoid HTTP call to self
    const resumes = resumeRepository.getAll();
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume) {
      throw createError({
        statusCode: 404,
        message: 'Resume not found'
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

    // Generate proposal using Claude
    const proposal = await generateUpworkProposal(jobPosting, resume.content, analysis, useMemory, config);
    
    return {
      success: true,
      proposal: proposal
    };

  } catch (error: any) {
    console.error('Error in Upwork proposal generation:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate proposal'
    });
  }
});

/**
 * Generate an Upwork proposal using Claude with optional memory integration
 */
async function generateUpworkProposal(
  jobPosting: string, 
  resume: string, 
  analysis: string, 
  useMemory: boolean, 
  config: any
): Promise<string> {
  try {
    // Integrate memory service when useMemory is true
    let memoryContext = '';
    if (useMemory) {
      console.log('Memory integration requested for proposal generation');
      const memoryResult = await MemoryService.getComprehensiveProfile();
      if (memoryResult.success && memoryResult.memories.length > 0) {
        memoryContext = '\n\nCareer information and writing style guidelines from memory:\n' + 
          MemoryService.formatMemoriesForPrompt(memoryResult.memories);
        console.log(`Retrieved ${memoryResult.memories.length} relevant memories for proposal`);
      } else {
        console.log('No memories retrieved or memory query failed:', memoryResult.error);
        memoryContext = '\n\n[Note: Memory integration requested but no relevant information found]';
      }
    }

    // Create proposal generation prompt
    const prompt = `Based on the job analysis, create a compelling Upwork proposal for this job posting.

JOB POSTING:
${jobPosting}

RESUME:
${resume}

SUITABILITY ANALYSIS:
${analysis}${memoryContext}

Create a professional, personalized Upwork proposal that:

1. **Opens Strong**: Start with a specific hook that shows you understand the project
2. **Demonstrates Relevant Experience**: Highlight the most relevant skills/projects from the resume
3. **Shows Value**: Explain what you'll deliver and how you'll approach the work
4. **Addresses Concerns**: Subtly handle any potential weaknesses identified in the analysis
5. **Professional Close**: End with next steps and availability

Requirements:
- Keep it concise but substantive (aim for 200-300 words)
- Use a confident, professional tone
- Avoid generic templates or obvious AI language
- Be specific about relevant experience and tools
- Include a brief mention of your process or approach
- End with a call to action

Write ONLY the proposal text - no additional commentary or formatting instructions.`;

    console.log('Calling Claude API for proposal generation...');
    const startTime = Date.now();
    
    const result = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      system: "You are an expert freelance proposal writer who creates compelling, personalized Upwork proposals that win jobs. Write in a natural, professional voice that demonstrates expertise without sounding generic or AI-generated.",
      messages: [
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      maxTokens: 1500,
      temperature: 0.7
    });
    
    const endTime = Date.now();
    console.log(`Claude API proposal generated in ${endTime - startTime}ms`);
    
    return result.text;
    
  } catch (error: any) {
    console.error('Error in generateUpworkProposal:', error);
    throw error;
  }
}