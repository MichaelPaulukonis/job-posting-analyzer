import type { SavedAnalysis } from '../types';
import type { CoverLetterGeneration, InstructionStep, GenerationContext } from '../types/instruction-stack';

/**
 * Creates a new cover letter generation with instruction tracking
 */
export const createGeneration = (
  analysis: SavedAnalysis,
  sampleLetter?: string
): CoverLetterGeneration => {
  return {
    id: generateId(),
    analysisId: analysis.id,
    baseContent: '',
    currentContent: '',
    instructionStack: [],
    sampleLetter,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Adds a new instruction to the stack
 */
export const addInstruction = (
  generation: CoverLetterGeneration,
  instruction: string,
  newContent: string
): CoverLetterGeneration => {
  const newStep: InstructionStep = {
    id: generateId(),
    instruction,
    timestamp: new Date().toISOString(),
    appliedTo: generation.currentContent ? generation.id : undefined
  };

  return {
    ...generation,
    currentContent: newContent,
    instructionStack: [...generation.instructionStack, newStep],
    updatedAt: new Date().toISOString()
  };
};

/**
 * Creates a context for AI generation that includes all cumulative instructions
 */
export const createGenerationContext = (
  analysis: SavedAnalysis,
  generation: CoverLetterGeneration
): GenerationContext => {
  // Combine all instructions into a cumulative instruction set
  const cumulativeInstructions = generation.instructionStack
    .map((step, index) => `${index + 1}. ${step.instruction}`)
    .join('\n');

  return {
    analysis,
    sampleLetter: generation.sampleLetter,
    cumulativeInstructions,
    referenceContent: generation.currentContent
  };
};

/**
 * Enhanced prompt creation that includes cumulative instructions
 */
export const createInstructionStackPrompt = (
  context: GenerationContext
): { systemInstruction: string; userPrompt: string } => {
  const { analysis, sampleLetter, cumulativeInstructions, referenceContent } = context;
  const { jobPosting, resume, matches, maybes, gaps } = analysis;
  
  let prompt = `
Generate a professional cover letter for the following job application. The cover letter should be personalized based on the analysis results of the resume against the job posting.

JOB POSTING ${jobPosting.title ? `(${jobPosting.title})` : ''}:
###
${jobPosting.content}
###

RESUME:
###
${resume.content}
###

ANALYSIS RESULTS:
1. Matching Skills and Qualifications:
${matches.map(match => `- ${match}`).join('\n')}

2. Potential Skill Matches (different terminology):
${maybes?.map(maybe => `- ${maybe}`).join('\n')}

3. Missing Skills and Qualifications (skill gaps):
${gaps.map(gap => `- ${gap}`).join('\n')}
`;

  if (sampleLetter) {
    prompt += `
MY SAMPLE COVER LETTER (use similar tone and style and use any relevant content):
###
${sampleLetter}
###
`;
  }

  if (cumulativeInstructions) {
    prompt += `
CUMULATIVE INSTRUCTIONS TO APPLY:
${cumulativeInstructions}
`;
  }

  if (referenceContent) {
    prompt += `
CURRENT VERSION (maintain good edits while applying the instructions):
###
${referenceContent}
###
`;
  }

  return {
    systemInstruction: getSystemInstructionLetter(),
    userPrompt: prompt
  };
};

/**
 * Reverts to a specific instruction in the stack
 */
export const revertToInstruction = (
  generation: CoverLetterGeneration,
  stepIndex: number
): CoverLetterGeneration => {
  return {
    ...generation,
    instructionStack: generation.instructionStack.slice(0, stepIndex + 1),
    updatedAt: new Date().toISOString()
  };
};

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const getSystemInstructionLetter = (): string => {
  return `
You are a professional cover letter writer. When generating cover letters:

COVER LETTER WRITING GUIDELINES:
1. Use simple, direct language - avoid corporate jargon and flowery phrases
2. Be specific rather than general - include concrete examples and metrics where possible
3. Match tone to the industry (slightly more formal for finance, more casual for creative fields)
4. Keep paragraphs focused and concise
5. Address the most important matching skills with specific examples
6. Acknowledge skill gaps with transferable skills or learning plans
7. Show enthusiasm without using clichéd language
8. Format in standard business letter format with Markdown
9. Keep it around 300-400 words (3-4 paragraphs)

AVOID THESE OVERUSED TERMS:
Adventure, Beacon, Bustling, Cutting-edge, Delve, Demistify, Depicted, Discover, Dive, Elegant, Enrich, Entanglement, Ever-evolving, Harnessing, Hurdles, Insurmountable, Journey, Leverage, Multifaceted, Navigate, Navigation, New Era, Passion, Pivot, Poised, Realm, Tailored, Tapestry, Unleash, Unlock, Unprecedented, Unravel, Unveiling the power

SUBSTITUTION STRATEGIES:
- Replace "passionate about" with specific interest statements
- Replace vague descriptors with specific technologies or methods
- Instead of "journey," describe the actual progression
- Replace "cutting-edge" with the specific innovation
- Instead of "challenges," name the actual problems solved

STRUCTURE GUIDANCE:
- Open with a clear connection to the role and company
- Middle paragraphs: highlight matching experience with examples
- Address skill gaps with transferable skills
- Closing: express interest and suggest next steps
- No specific years of experience to avoid age discrimination
- Do not include any commentary before or after the letter - only the letter should be provided
`;
};
