export interface InstructionStep {
  id: string;
  instruction: string;
  timestamp: string;
  appliedTo?: string; // Previous version ID this was applied to
}

export interface CoverLetterGeneration {
  id: string;
  analysisId: string;
  baseContent: string; // Initial generation
  currentContent: string; // Latest version
  instructionStack: InstructionStep[];
  sampleLetter?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationContext {
  analysis: import('../types').SavedAnalysis;
  sampleLetter?: string;
  cumulativeInstructions: string;
  referenceContent: string;
}
