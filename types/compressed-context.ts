export interface CompressedContext {
  id: string;
  analysisId: string;
  
  // Core context (always preserved)
  coreContext: {
    analysis: import('../types').SavedAnalysis;
    sampleLetter?: string;
    systemInstructions: string;
  };
  
  // Compressed conversation history
  contextSummary: string;
  
  // Recent conversation (last N messages)
  recentMessages: import('./conversation').ConversationMessage[];
  
  // Current state
  currentContent: string;
  
  // Metadata
  totalIterations: number;
  compressionLevel: 'none' | 'light' | 'aggressive';
  createdAt: string;
  updatedAt: string;
}

export interface CompressionConfig {
  maxRecentMessages: number;
  compressionThreshold: number;
  keyInstructionsToPreserve: string[];
}
