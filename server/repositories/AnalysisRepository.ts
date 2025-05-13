import { FileStorageService } from '../services/FileStorageService';

export interface SavedAnalysis {
  id: string;
  jobTitle?: string;
  resumeSnippet?: string;
  jobPosting?: {
    title?: string;
    content: string;
  };
  resume?: {
    content: string;
  };
  coverLetter?: {
    content: string;
  };
  [key: string]: any;
}

export class AnalysisRepository extends FileStorageService<SavedAnalysis> {
  constructor() {
    super('analysis-history.json');
  }

  /**
   * Update or add a cover letter to an analysis
   */
  public saveCoverLetter(analysisId: string, coverLetter: { content: string }): void {
    const analysis = this.getById(analysisId);
    
    if (!analysis) {
      throw new Error(`Analysis with ID ${analysisId} not found`);
    }
    
    analysis.coverLetter = coverLetter;
    this.save(analysis);
  }
}

// Create a singleton instance
const analysisRepository = new AnalysisRepository();
export default analysisRepository;
