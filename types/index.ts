export interface JobPosting {
  title?: string;
  content: string;
}

export interface Resume {
  content: string;
}

export interface AnalysisResult {
  matches: string[];
  maybes: string[];
  gaps: string[];
  suggestions: string[];
  timestamp: string;
}

export interface CoverLetter {
  content: string;
  timestamp: string;
  sampleContent?: string;  // Optional sample letter
  instructions?: string;   // Optional instructions for regeneration
  history: CoverLetterVersion[];  // History of previous versions
  editedSections: Edit[];
}

export interface CoverLetterVersion {
  content: string;
  timestamp: string;
  instructions?: string;
  sampleContent?: string;
  edits?: Edit[];
}

export interface Edit {
  type: 'added' | 'removed';
  value: string;
  timestamp: string;
}

export interface SavedAnalysis extends AnalysisResult {
  id: string;
  jobTitle?: string;
  resumeSnippet?: string;
  jobPosting: JobPosting;
  resume: Resume;
  coverLetter?: CoverLetter;  // Optional cover letter
  conversationId?: string;  // Optional conversation ID
}

export interface ResumeEntry {
  id: string;
  name: string;
  content: string;
  timestamp: string;
}

export type ServiceName = 'mock' | 'gemini' | 'openai' | 'anthropic';
