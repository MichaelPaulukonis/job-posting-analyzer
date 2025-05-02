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

export interface SavedAnalysis extends AnalysisResult {
  id: string;
  jobTitle?: string;
  resumeSnippet?: string;
  jobPosting: JobPosting;
  resume: Resume;
}
