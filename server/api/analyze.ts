import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAnalysisPrompt } from '~/utils/promptUtils';
import { parseGeminiResponse } from '~/utils/responseParser';

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
    const { jobPosting, resume, service = 'gemini' } = body;
    
    console.log(`API Request: Analyzing with ${service} service`);
    
    if (!jobPosting || !resume) {
      console.log('API Error: Missing job posting or resume data');
      throw createError({
        statusCode: 400,
        message: 'Missing job posting or resume data'
      });
    }
    
    // Generate analysis based on service type
    let result;
    if (service === 'gemini') {
      console.log('Using Gemini service with model:', config.geminiModel);
      result = await analyzeWithGemini(jobPosting, resume, config);
    } else if (service === 'mock') {
      console.log('Using mock service');
      result = await generateMockAnalysis(jobPosting, resume);
    } else {
      console.log(`API Error: Unsupported service: ${service}`);
      throw createError({
        statusCode: 400,
        message: `Unsupported service: ${service}`
      });
    }
    
    console.log('Analysis completed successfully. Result summary:', {
      matches: result.matches.length,
      gaps: result.gaps.length,
      suggestions: result.suggestions.length
    });
    
    return result;
  } catch (error: any) {
    console.error('Error in analyze API:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Error processing analysis request'
    });
  }
});

/**
 * Analyze with Gemini API (server-side only)
 */
async function analyzeWithGemini(jobPosting: any, resume: any, config: any) {
  // Initialize Gemini client
  const ai = new GoogleGenerativeAI(config.geminiApiKey);
  const model = ai.getGenerativeModel({ model: config.geminiModel });
  
  // Generate prompt
  const prompt = createAnalysisPrompt(jobPosting, resume);
  console.log('Generated prompt for Gemini:', prompt);
  
  // Call Gemini API
  console.log('Calling Gemini API...');
  const startTime = Date.now();
  const result = await model.generateContent(prompt);
  const endTime = Date.now();
  console.log(`Gemini API response received in ${endTime - startTime}ms`);
  
  const response = result.response;
  const text = response.text();
  console.log('Raw Gemini response:', text);
  
  // Parse the response using our utility function
  return parseGeminiResponse(text);
}

/**
 * Generate a mock analysis response
 */
async function generateMockAnalysis(jobPosting: any, resume: any) {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Extract some skills
  const jobKeywords = extractMockKeywords(jobPosting.content);
  const resumeKeywords = extractMockKeywords(resume.content);
  
  // Find matches and gaps
  const matches = jobKeywords.filter(keyword => 
    resumeKeywords.some(rk => rk.toLowerCase() === keyword.toLowerCase())
  );
  
  const gaps = jobKeywords.filter(keyword => 
    !resumeKeywords.some(rk => rk.toLowerCase() === keyword.toLowerCase())
  );
  
  // Generate suggestions
  const suggestions = generateMockSuggestions(gaps);
  
  return {
    matches,
    gaps,
    suggestions,
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract mock keywords from text
 */
function extractMockKeywords(text: string): string[] {
  // List of common technical skills and qualifications
  const knownSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 
    'Python', 'Java', 'C#', 'HTML', 'CSS', 'SQL', 'NoSQL', 'Docker',
    'AWS', 'Azure', 'GCP', 'Kubernetes', 'REST API', 'GraphQL',
    'Agile', 'Scrum', 'CI/CD', 'Git', 'TDD', 'Redux', 'MongoDB',
    'MySQL', 'PostgreSQL', 'DevOps', 'Microservices', 'OOP',
    'Functional Programming', 'Unit Testing', 'Responsive Design'
  ];
  
  // Extract skills that appear in the text
  const foundSkills = knownSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Add some random years of experience requirements
  if (foundSkills.length > 0 && Math.random() > 0.5) {
    const randomSkill = foundSkills[Math.floor(Math.random() * foundSkills.length)];
    const years = Math.floor(Math.random() * 5) + 1;
    foundSkills.push(`${years}+ years of ${randomSkill}`);
  }
  
  return foundSkills;
}

/**
 * Generate mock suggestions
 */
function generateMockSuggestions(gaps: string[]): string[] {
  if (gaps.length === 0) {
    return ['Your resume already covers all the required skills!'];
  }
  
  const suggestions = [
    `Add the following missing skills to your resume: ${gaps.join(', ')}`,
    'Consider restructuring your resume to highlight relevant experience',
    'Quantify your achievements with metrics where possible'
  ];
  
  // Add specific suggestions for each gap
  gaps.forEach(gap => {
    if (Math.random() > 0.3) {
      suggestions.push(`Consider adding experience or projects that demonstrate your ${gap} skills`);
    }
  });
  
  return suggestions;
}
