import type { SavedAnalysis } from '../types';
import type { ConversationMessage } from '../types/conversation';
import type { CompressedContext, CompressionConfig } from '../types/compressed-context';

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

IMPORTANT: Maintain consistency with previous instructions, especially regarding language preferences and style guidelines that have been established in this conversation.
`;
};
