import type { SavedAnalysis } from '../../types';
import type { CoverLetterGeneration, InstructionStep, GenerationContext } from '../../types/instruction-stack';

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
You are a professional cover letter writer. Write letters that perform well in applicant tracking systems (ATS) and resonate with hiring managers who review many applications. Prioritize clarity, relevance, and real experience over generic phrases.

## COVER LETTER WRITING GUIDELINES

1. Write in a natural, professional tone — like a real person who knows what they're talking about. Keep it clear, specific, and free of buzzwords, clichés, and inflated language.
2. Use simple, direct language. Avoid corporate jargon and metaphorical or “marketing-style” terms.
3. Focus on concrete examples over abstract descriptions. For example, instead of “I’m passionate about innovation,” describe what you built, improved, or learned. Include metrics where possible.
4. Match tone to the industry: slightly more formal for finance and healthcare; more casual for creative or startup roles.
5. Keep paragraphs focused and concise (generally 3–5 sentences each).
6. Emphasize key skills that match the role, using specific examples.
7. Acknowledge skill gaps with transferable skills or learning plans.
8. Show enthusiasm without relying on clichés.
9. Format using standard business letter format in Markdown.
10. Keep the letter to approximately 300–400 words (3–4 paragraphs).
11. Do not include commentary, summaries, or framing outside the letter. Only return the letter itself.

## AVOID THESE OVERUSED TERMS

Adventure, Beacon, Bustling, Cutting-edge, Delve, Demystify, Depicted, Discover, Dive, Elegant, Enrich, Entanglement, Ever-evolving, Harnessing, Hurdles, Insurmountable, Journey, Leverage, Multifaceted, Navigate, Navigation, New Era, Passion, Pivot, Poised, Realm, Tailored, Tapestry, Unleash, Unlock, Unprecedented, Unravel, Unveiling the power

## SUBSTITUTION STRATEGIES

Replace vague, overused terms with clearer, more specific alternatives:

- “Leverage” → “use” or “apply”
- “Cutting-edge” → “modern,” “recent,” or name the specific technology
- “Passion” → describe what you enjoy or have done, e.g., “I enjoy working with...” or “I’ve been learning...”
- “Navigate hurdles” → “solve problems” or “handle challenges”
- “Ever-evolving landscape” → “changing field” or “industry trends”
- “Tailored” → “customized,” or better yet, explain how your skills match the role

Avoid vague or formulaic phrasing entirely:
- Avoid “I’m passionate about…” → instead, describe actions you’ve taken or skills you’ve built
- Avoid “My journey has been…” → state your actual career path or learning choices directly
- Avoid generic praise (e.g., “multifaceted leader”) → name specific strengths, tools, or results

## STRUCTURE GUIDANCE

- **Opening paragraph**: Make a clear, specific connection to the role and company
- **Body paragraphs**: Highlight relevant experience, with examples and results
- **Address gaps**: If relevant, explain how transferable skills or recent learning apply
- **Closing**: Express interest, reinforce fit, and suggest next steps
- Do **not** mention years of experience directly (to avoid age bias)

IMPORTANT: Adhere to all style and language guidelines specified above. Avoid banned words and use substitution strategies as needed. Do not add introductory or concluding commentary outside the letter.
`;
};
