import type { AnalysisResult, SavedAnalysis, JobPosting, Resume } from '../types';

const STORAGE_KEY = 'job-analysis-history';

export class StorageService {
  /**
   * Save an analysis result to local storage
   */
  static saveAnalysis(result: AnalysisResult, jobPosting: JobPosting, resume: Resume): SavedAnalysis {
    const savedAnalyses = this.getAnalyses();
    
    const analysisToSave: SavedAnalysis = {
      ...result,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      jobTitle: jobPosting.title || undefined,
      resumeSnippet: resume.content.substring(0, 100) + (resume.content.length > 100 ? '...' : '')
    };
    
    savedAnalyses.unshift(analysisToSave);
    
    // Keep only the latest 10 analyses
    const trimmedAnalyses = savedAnalyses.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedAnalyses));
    
    return analysisToSave;
  }
  
  /**
   * Get all saved analyses
   */
  static getAnalyses(): SavedAnalysis[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse saved analyses:', e);
      return [];
    }
  }
  
  /**
   * Delete a specific analysis
   */
  static deleteAnalysis(id: string): void {
    const savedAnalyses = this.getAnalyses();
    const updatedAnalyses = savedAnalyses.filter(analysis => analysis.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAnalyses));
  }
  
  /**
   * Clear all saved analyses
   */
  static clearAnalyses(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
