import type { AnalysisResult, SavedAnalysis, JobPosting, Resume, CoverLetter } from '../types';

export class StorageService {
  private static getBaseUrl() {
    // In development, use the current origin
    if (process.dev) {
      return window.location.origin;
    }
    // In production, use the configured base URL or fallback to current origin
    return process.env.NUXT_PUBLIC_API_BASE || window.location.origin;
  }

  private static async fetchWithBaseUrl(path: string, options?: RequestInit) {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${path}`;
    return fetch(url, options);
  }

  /**
   * Save an analysis result to file storage
   */
  static async saveAnalysis(result: AnalysisResult, jobPosting: JobPosting, resume: Resume): Promise<SavedAnalysis> {
    try {
      // Get current analyses
      const savedAnalyses = await this.getAnalyses();
      
      // Create new analysis object with complete job posting and resume
      const analysisToSave: SavedAnalysis = {
        ...result,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        jobTitle: jobPosting.title || undefined,
        resumeSnippet: resume.content.substring(0, 100) + (resume.content.length > 100 ? '...' : ''),
        // Store the complete job posting and resume
        jobPosting: {
          title: jobPosting.title,
          content: jobPosting.content
        },
        resume: {
          content: resume.content
        }
      };
      
      // Add to the beginning of the array
      savedAnalyses.unshift(analysisToSave);
      
      // Keep only the latest 10 analyses
      const trimmedAnalyses = savedAnalyses.slice(0, 10);
      
      // Save to server
      await this.fetchWithBaseUrl('/api/storage', {
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
   * Save a cover letter for an analysis
   */
  static async saveCoverLetter(analysisId: string, coverLetter: CoverLetter): Promise<void> {
    try {
      // Get current analyses
      const savedAnalyses = await this.getAnalyses();
      
      // Find the analysis to update
      const analysisIndex = savedAnalyses.findIndex(a => a.id === analysisId);
      
      if (analysisIndex === -1) {
        throw new Error('Analysis not found');
      }
      
      // Update the cover letter
      savedAnalyses[analysisIndex].coverLetter = coverLetter;
      
      // Save to server
      await this.fetchWithBaseUrl('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(savedAnalyses)
      });
      
    } catch (error) {
      console.error('Error saving cover letter:', error);
      throw error;
    }
  }
  
  /**
   * Get all saved analyses
   */
  static async getAnalyses(): Promise<SavedAnalysis[]> {
    try {
      // Fetch from server
      const response = await this.fetchWithBaseUrl('/api/storage');
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
      await this.fetchWithBaseUrl(`/api/storage/${id}`, {
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
      await this.fetchWithBaseUrl('/api/storage', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error clearing analyses:', error);
      // Fallback to localStorage if server clear fails
      this.clearAnalysesFromLocalStorage();
    }
  }
  
  /**
   * Save a resume to storage
   */
  static async saveResume(resume: Resume, title?: string): Promise<string> {
    try {
      // Get current resumes
      const savedResumes = await this.getResumes();
      
      // Create new resume object
      const resumeToSave = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        title: title || `Resume ${savedResumes.length + 1}`,
        content: resume.content,
        timestamp: new Date().toISOString()
      };
      
      // Add to the beginning of the array
      savedResumes.unshift(resumeToSave);
      
      // Keep only the latest 10 resumes
      const trimmedResumes = savedResumes.slice(0, 10);
      
      // Save to server
      await this.fetchWithBaseUrl('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimmedResumes)
      });
      
      return resumeToSave.id;
    } catch (error) {
      console.error('Error saving resume:', error);
      // Fallback to localStorage if server storage fails
      return this.saveResumeToLocalStorage(resume, title);
    }
  }

  /**
   * Get all saved resumes
   */
  static async getResumes(): Promise<Array<{ id: string; title: string; content: string; timestamp: string }>> {
    try {
      // Fetch from server
      const response = await this.fetchWithBaseUrl('/api/resumes');
      if (!response.ok) {
        throw new Error('Failed to fetch resumes from server');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching resumes:', error);
      // Fallback to localStorage if server fetch fails
      return this.getResumesFromLocalStorage();
    }
  }

  /**
   * Delete a specific resume
   */
  static async deleteResume(id: string): Promise<void> {
    try {
      // Delete from server
      await this.fetchWithBaseUrl(`/api/resumes/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      // Fallback to localStorage if server delete fails
      this.deleteResumeFromLocalStorage(id);
    }
  }

  /**
   * Clear all saved resumes
   */
  static async clearResumes(): Promise<void> {
    try {
      // Clear from server
      await this.fetchWithBaseUrl('/api/resumes', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error clearing resumes:', error);
      // Fallback to localStorage if server clear fails
      this.clearResumesFromLocalStorage();
    }
  }
  
  /**
   * Save a cover letter sample
   */
  static async saveCoverLetterSample(sample: { content: string; name: string; notes: string }): Promise<string> {
    try {
      // Get current samples
      const savedSamples = await this.getCoverLetterSamples();
      
      // Create new sample object
      const sampleToSave = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: sample.name,
        content: sample.content,
        notes: sample.notes,
        timestamp: new Date().toISOString()
      };
      
      // Add to the beginning of the array
      savedSamples.unshift(sampleToSave);
      
      // Save to server
      await this.fetchWithBaseUrl('/api/cover-letter-samples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(savedSamples)
      });
      
      return sampleToSave.id;
    } catch (error) {
      console.error('Error saving cover letter sample:', error);
      // Fallback to localStorage if server storage fails
      return this.saveCoverLetterSampleToLocalStorage(sample);
    }
  }

  /**
   * Get all saved cover letter samples
   */
  static async getCoverLetterSamples(): Promise<Array<{ id: string; name: string; content: string; notes: string; timestamp: string }>> {
    try {
      // Fetch from server
      const response = await this.fetchWithBaseUrl('/api/cover-letter-samples');
      if (!response.ok) {
        throw new Error('Failed to fetch cover letter samples from server');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching cover letter samples:', error);
      // Fallback to localStorage if server fetch fails
      return this.getCoverLetterSamplesFromLocalStorage();
    }
  }

  /**
   * Delete a specific cover letter sample
   */
  static async deleteCoverLetterSample(id: string): Promise<void> {
    try {
      // Delete from server
      await this.fetchWithBaseUrl(`/api/cover-letter-samples/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting cover letter sample:', error);
      // Fallback to localStorage if server delete fails
      this.deleteCoverLetterSampleFromLocalStorage(id);
    }
  }

  /**
   * Clear all saved cover letter samples
   */
  static async clearCoverLetterSamples(): Promise<void> {
    try {
      // Clear from server
      await this.fetchWithBaseUrl('/api/cover-letter-samples', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error clearing cover letter samples:', error);
      // Fallback to localStorage if server clear fails
      this.clearCoverLetterSamplesFromLocalStorage();
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
      resumeSnippet: resume.content.substring(0, 100) + (resume.content.length > 100 ? '...' : ''),
      // Store the complete job posting and resume
      jobPosting: {
        title: jobPosting.title,
        content: jobPosting.content
      },
      resume: {
        content: resume.content
      }
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
  
  // --- Fallback localStorage methods for resumes ---
  
  private static RESUMES_STORAGE_KEY = 'saved-resumes';
  
  private static saveResumeToLocalStorage(resume: Resume, title?: string): string {
    const savedResumes = this.getResumesFromLocalStorage();
    
    const resumeToSave = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title: title || `Resume ${savedResumes.length + 1}`,
      content: resume.content,
      timestamp: new Date().toISOString()
    };
    
    savedResumes.unshift(resumeToSave);
    
    // Keep only the latest 10 resumes
    const trimmedResumes = savedResumes.slice(0, 10);
    localStorage.setItem(this.RESUMES_STORAGE_KEY, JSON.stringify(trimmedResumes));
    
    return resumeToSave.id;
  }
  
  private static getResumesFromLocalStorage(): Array<{ id: string; title: string; content: string; timestamp: string }> {
    const data = localStorage.getItem(this.RESUMES_STORAGE_KEY);
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse saved resumes from localStorage:', e);
      return [];
    }
  }
  
  private static deleteResumeFromLocalStorage(id: string): void {
    const savedResumes = this.getResumesFromLocalStorage();
    const updatedResumes = savedResumes.filter(resume => resume.id !== id);
    localStorage.setItem(this.RESUMES_STORAGE_KEY, JSON.stringify(updatedResumes));
  }
  
  private static clearResumesFromLocalStorage(): void {
    localStorage.removeItem(this.RESUMES_STORAGE_KEY);
  }

  // --- Fallback localStorage methods for cover letter samples ---
  
  private static COVER_LETTER_SAMPLES_STORAGE_KEY = 'saved-cover-letter-samples';
  
  private static saveCoverLetterSampleToLocalStorage(sample: { content: string; name: string; notes: string }): string {
    const savedSamples = this.getCoverLetterSamplesFromLocalStorage();
    
    const sampleToSave = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      name: sample.name,
      content: sample.content,
      notes: sample.notes,
      timestamp: new Date().toISOString()
    };
    
    savedSamples.unshift(sampleToSave);
    localStorage.setItem(this.COVER_LETTER_SAMPLES_STORAGE_KEY, JSON.stringify(savedSamples));
    
    return sampleToSave.id;
  }
  
  private static getCoverLetterSamplesFromLocalStorage(): Array<{ id: string; name: string; content: string; notes: string; timestamp: string }> {
    const data = localStorage.getItem(this.COVER_LETTER_SAMPLES_STORAGE_KEY);
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse saved cover letter samples from localStorage:', e);
      return [];
    }
  }
  
  private static deleteCoverLetterSampleFromLocalStorage(id: string): void {
    const savedSamples = this.getCoverLetterSamplesFromLocalStorage();
    const updatedSamples = savedSamples.filter(sample => sample.id !== id);
    localStorage.setItem(this.COVER_LETTER_SAMPLES_STORAGE_KEY, JSON.stringify(updatedSamples));
  }
  
  private static clearCoverLetterSamplesFromLocalStorage(): void {
    localStorage.removeItem(this.COVER_LETTER_SAMPLES_STORAGE_KEY);
  }
}
