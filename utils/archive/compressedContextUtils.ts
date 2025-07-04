import type { SavedAnalysis } from '../../types';
import type { ConversationMessage } from '../../types/conversation';
import type { CompressedContext, CompressionConfig } from '../../types/compressed-context';

const DEFAULT_CONFIG: CompressionConfig = {
  maxRecentMessages: 6, // Last 3 user-assistant pairs
  compressionThreshold: 8, // Compress when more than 8 messages
  keyInstructionsToPreserve: [
    'avoid corporate jargon',
    'remove flowery language',
    'use specific examples',
    'avoid overused terms'
  ]
};

/**
 * Creates a new compressed context
 */
export const createCompressedContext = (
  analysis: SavedAnalysis,
  sampleLetter?: string
): CompressedContext => {
  
  return {
    id: generateId(),
    analysisId: analysis.id,
    coreContext: {
      analysis,
      sampleLetter,
      systemInstructions: getSystemInstructionLetter()
    },
    contextSummary: '',
    recentMessages: [],
    currentContent: '',
    totalIterations: 0,
    compressionLevel: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Adds a new user instruction and assistant response
 */
export const addInteraction = async (
  context: CompressedContext,
  userInstruction: string,
  assistantResponse: string,
  config: Partial<CompressionConfig> = {}
): Promise<CompressedContext> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const userMessage: ConversationMessage = {
    role: 'user',
    content: userInstruction,
    timestamp: new Date().toISOString()
  };
  
  const assistantMessage: ConversationMessage = {
    role: 'assistant',
    content: assistantResponse,
    timestamp: new Date().toISOString()
  };
  
  const updatedContext = {
    ...context,
    recentMessages: [...context.recentMessages, userMessage, assistantMessage],
    currentContent: assistantResponse,
    totalIterations: context.totalIterations + 1,
    updatedAt: new Date().toISOString()
  };
  
  // Check if compression is needed
  if (updatedContext.recentMessages.length > finalConfig.compressionThreshold) {
    return await compressContext(updatedContext, finalConfig);
  }
  
  return updatedContext;
};

/**
 * Compresses old conversation history into a summary
 */
const compressContext = async (
  context: CompressedContext,
  config: CompressionConfig
): Promise<CompressedContext> => {
  const messagesToCompress = context.recentMessages.slice(0, -config.maxRecentMessages);
  const recentMessages = context.recentMessages.slice(-config.maxRecentMessages);
  
  // Create a summary of the compressed messages
  const compressionSummary = createCompressionSummary(messagesToCompress, config);
  
  const newContextSummary = context.contextSummary 
    ? `${context.contextSummary}\n\n${compressionSummary}`
    : compressionSummary;
  
  return {
    ...context,
    contextSummary: newContextSummary,
    recentMessages,
    compressionLevel: messagesToCompress.length > 10 ? 'aggressive' : 'light'
  };
};

/**
 * Creates a summary from messages being compressed
 */
const createCompressionSummary = (
  messages: ConversationMessage[],
  config: CompressionConfig
): string => {
  const userInstructions = messages
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content);
  
  // Extract key instructions that should be preserved
  const keyInstructions = userInstructions.filter(instruction =>
    config.keyInstructionsToPreserve.some(key =>
      instruction.toLowerCase().includes(key.toLowerCase())
    )
  );
  
  const otherInstructions = userInstructions.filter(instruction =>
    !config.keyInstructionsToPreserve.some(key =>
      instruction.toLowerCase().includes(key.toLowerCase())
    )
  );
  
  let summary = `Previous iterations included:\n`;
  
  if (keyInstructions.length > 0) {
    summary += `Key instructions to maintain:\n${keyInstructions.map(inst => `- ${inst}`).join('\n')}\n\n`;
  }
  
  if (otherInstructions.length > 0) {
    summary += `Other modifications requested:\n${otherInstructions.map(inst => `- ${inst.substring(0, 100)}...`).join('\n')}`;
  }
  
  return summary;
};

/**
 * Prepares the context for AI generation
 */
export const prepareForGeneration = (
  context: CompressedContext,
  newInstruction?: string
): { systemInstruction: string; userPrompt: string } => {
  const { coreContext, contextSummary, recentMessages, currentContent } = context;
  const { analysis, sampleLetter } = coreContext;
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

  if (contextSummary) {
    prompt += `
PREVIOUS CONTEXT SUMMARY:
${contextSummary}
`;
  }

  if (recentMessages.length > 0) {
    prompt += `
RECENT CONVERSATION:
${recentMessages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}
`;
  }

  if (currentContent) {
    prompt += `
CURRENT VERSION:
###
${currentContent}
###
`;
  }

  if (newInstruction) {
    prompt += `
NEW INSTRUCTION:
${newInstruction}
`;
  }

  return {
    systemInstruction: coreContext.systemInstructions,
    userPrompt: prompt
  };
};

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const getSystemInstructionLetter = (): string => {
  return `
You are a professional cover letter writer. Write letters that perform well in applicant tracking systems (ATS) and resonate with hiring managers who review many applications. Prioritize clarity, relevance, and real experience over generic phrases.

## COVER LETTER WRITING GUIDELINESx

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
