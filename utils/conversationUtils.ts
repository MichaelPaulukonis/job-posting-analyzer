import type { SavedAnalysis } from '../types';
import type { ConversationMessage, ConversationContext } from '../types/conversation';

/**
 * Creates a conversation context for cover letter generation
 */
export const createConversationContext = (
  analysis: SavedAnalysis,
  sampleLetter?: string
): ConversationContext => {
  const systemMessage: ConversationMessage = {
    role: 'system',
    content: getSystemInstructionLetter(),
    timestamp: new Date().toISOString()
  };

  const analysisContext: ConversationMessage = {
    role: 'user',
    content: createInitialAnalysisPrompt(analysis, sampleLetter),
    timestamp: new Date().toISOString(),
    metadata: { sampleLetter }
  };

  return {
    systemMessage,
    analysisContext,
    conversationHistory: []
  };
};

/**
 * Adds a user instruction and assistant response to conversation history
 */
export const addToConversation = (
  context: ConversationContext,
  userInstructions: string,
  assistantResponse: string,
  referenceContent?: string
): ConversationContext => {
  const userMessage: ConversationMessage = {
    role: 'user',
    content: userInstructions,
    timestamp: new Date().toISOString(),
    metadata: { referenceContent }
  };

  const assistantMessage: ConversationMessage = {
    role: 'assistant',
    content: assistantResponse,
    timestamp: new Date().toISOString()
  };

  return {
    ...context,
    conversationHistory: [
      ...context.conversationHistory,
      userMessage,
      assistantMessage
    ]
  };
};

/**
 * Converts conversation context to format expected by AI services
 */
export const formatConversationForAI = (
  context: ConversationContext,
  newInstructions?: string,
  referenceContent?: string
): { systemInstruction: string; messages: { role: string; content: string }[] } => {
  const messages = [
    context.analysisContext,
    ...context.conversationHistory
  ];

  // Add new user instructions if provided
  if (newInstructions) {
    let instructionContent = newInstructions;
    
    if (referenceContent) {
      instructionContent += `\n\nREFERENCE VERSION (maintain good edits while incorporating changes):\n###\n${referenceContent}\n###`;
    }

    messages.push({
      role: 'user',
      content: instructionContent,
      timestamp: new Date().toISOString(),
      metadata: { instructions: newInstructions, referenceContent }
    });
  }

  return {
    systemInstruction: context.systemMessage.content,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  };
};

// Token management utility functions
export const estimateTokenCount = (conversation: ConversationContext): number => {
  const allContent = [
    conversation.systemMessage.content,
    conversation.analysisContext.content,
    ...conversation.conversationHistory.map(m => m.content)
  ].join(' ');
  
  // Rough estimation: ~4 characters per token
  return Math.ceil(allContent.length / 4);
};

export const isConversationTooLong = (
  conversation: ConversationContext, 
  maxTokens: number = 8000
): boolean => {
  return estimateTokenCount(conversation) > maxTokens;
};

export const createConversationSummary = (conversation: ConversationContext): string => {
  const userMessages = conversation.conversationHistory
    .filter(m => m.role === 'user')
    .map(m => m.content);
  
  return `Previous instructions included: ${userMessages.join('; ')}`;
};

// Helper functions
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

const createInitialAnalysisPrompt = (analysis: SavedAnalysis, sampleLetter?: string): string => {
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

  return prompt;
};
