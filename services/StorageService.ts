import type { AnalysisResult, SavedAnalysis, JobPosting, Resume } from '../types';

export class StorageService {
  /**
   * Save an analysis result to file storage
   */
  static async saveAnalysis(result: AnalysisResult, jobPosting: JobPosting, resume: Resume): Promise<SavedAnalysis> {
    try {
      // Get current analyses
      const savedAnalyses = await this.getAnalyses();
      
      // Create new analysis object
      const analysisToSave: SavedAnalysis = {
        ...result,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        jobTitle: jobPosting.title || undefined,
        resumeSnippet: resume.content.substring(0, 100) + (resume.content.length > 100 ? '...' : '')
      };
      
      // Add to the beginning of the array
      savedAnalyses.unshift(analysisToSave);
      
      // Keep only the latest 10 analyses
      const trimmedAnalyses = savedAnalyses.slice(0, 10);
      
      // Save to server
      await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimmedAnalyses)
      });
      
      return analysisToSave;
    } catch (error) {
      console.error('Error saving analysis:', error);
      // Fallback to localStorage if server storage fails
      return this.saveAnalysisToLocalStorage(result, jobPosting, resume);
    }
  }
  
  /**
   * Get all saved analyses
   */
  static async getAnalyses(): Promise<SavedAnalysis[]> {
    try {
      // Fetch from server
      const response = await fetch('/api/storage');
      if (!response.ok) {
        throw new Error('Failed to fetch analyses from server');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching analyses:', error);
      // Fallback to localStorage if server fetch fails
      return this.getAnalysesFromLocalStorage();
    }
  }
  
  /**
   * Delete a specific analysis
   */
  static async deleteAnalysis(id: string): Promise<void> {
    try {
      // Delete from server
      await fetch(`/api/storage/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      // Fallback to localStorage if server delete fails
      this.deleteAnalysisFromLocalStorage(id);
    }
  }
  
  /**
   * Clear all saved analyses
   */
  static async clearAnalyses(): Promise<void> {
    try {
      // Clear from server
      await fetch('/api/storage', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error clearing analyses:', error);
      // Fallback to localStorage if server clear fails
      this.clearAnalysesFromLocalStorage();
    }
  }
  
  // --- Fallback localStorage methods ---
  
  private static STORAGE_KEY = 'job-analysis-history';
  
  private static saveAnalysisToLocalStorage(result: AnalysisResult, jobPosting: JobPosting, resume: Resume): SavedAnalysis {
    const savedAnalyses = this.getAnalysesFromLocalStorage();
    
    const analysisToSave: SavedAnalysis = {
      ...result,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      jobTitle: jobPosting.title || undefined,
      resumeSnippet: resume.content.substring(0, 100) + (resume.content.length > 100 ? '...' : '')
    };
    
    savedAnalyses.unshift(analysisToSave);
    
    // Keep only the latest 10 analyses
    const trimmedAnalyses = savedAnalyses.slice(0, 10);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedAnalyses));
    
    return analysisToSave;
  }
  
  private static getAnalysesFromLocalStorage(): SavedAnalysis[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse saved analyses from localStorage:', e);
      return [];
    }
  }
  
  private static deleteAnalysisFromLocalStorage(id: string): void {
    const savedAnalyses = this.getAnalysesFromLocalStorage();
    const updatedAnalyses = savedAnalyses.filter(analysis => analysis.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedAnalyses));
  }
  
  private static clearAnalysesFromLocalStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
