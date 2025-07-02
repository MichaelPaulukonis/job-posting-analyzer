export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    instructions?: string;
    sampleLetter?: string;
    referenceContent?: string;
  };
}

export interface CoverLetterConversation {
  id: string;
  analysisId: string;
  messages: ConversationMessage[];
  currentContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationContext {
  systemMessage: ConversationMessage;
  analysisContext: ConversationMessage;
  conversationHistory: ConversationMessage[];
}
