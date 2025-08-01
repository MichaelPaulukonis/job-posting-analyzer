import type { AnalysisResult, SavedAnalysis, JobPosting, Resume, CoverLetter, ResumeEntry } from '../types';
import type { CoverLetterConversation } from '../types/conversation';

export class StorageService {
  private static getBaseUrl() {
    // Priority 1: Explicitly configured public API base URL
    // This is suitable for server-side environments and can also be used by the client if configured.
    if (process.env.NUXT_PUBLIC_API_BASE) {
      return process.env.NUXT_PUBLIC_API_BASE;
    }

    // Check if in a browser environment
    const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';

    if (isBrowser) {
      // In a browser environment, use the current origin if NUXT_PUBLIC_API_BASE is not set.
      // This covers both development and production browser scenarios.
      return window.location.origin;
    } else {
      // On the server, and NUXT_PUBLIC_API_BASE is not set.
      if (import.meta.dev) {
        // In development mode on the server, attempt to construct a default base URL.
        // Nuxt/Nitro often sets NITRO_HOST and NITRO_PORT.
        const host = process.env.NITRO_HOST || 'localhost';
        const port = process.env.NITRO_PORT || process.env.PORT || '3000'; // PORT is a common env var, 3000 is Nuxt's default.
        const protocol = host === 'localhost' ? 'http' : 'http'; // Default to http for local; consider 'https' if host is not localhost, though NUXT_PUBLIC_API_BASE is better for this.

        console.warn(
          `StorageService: NUXT_PUBLIC_API_BASE is not set. Defaulting to ${protocol}://${host}:${port} ` +
          `for server-side API calls in development. For production or specific configurations, ` +
          `please set NUXT_PUBLIC_API_BASE.`
        );
        return `${protocol}://${host}:${port}`;
      } else {
        // In a non-development (e.g., production) server environment,
        // if NUXT_PUBLIC_API_BASE is not set, this is a critical configuration issue.
        console.error(
          'StorageService: Unable to determine API base URL for server-side calls. ' +
          'NUXT_PUBLIC_API_BASE is not set, and not in a browser environment. ' +
          'This is a critical configuration error for production server environments. ' +
          'API calls will likely fail.'
        );
        return ''; // Return an empty string, which will cause fetchWithBaseUrl to throw an error.
      }
    }
  }

  private static async fetchWithBaseUrl(path: string, options?: RequestInit) {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      // getBaseUrl() already logs an error if it returns an empty string.
      throw new Error(`Cannot fetch from API: Base URL is not configured or could not be determined. Attempted path: ${path}`);
    }
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
      await useAPIFetch('/api/storage', {
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
      // If this also throws (e.g., on server where localStorage is undefined), the error will propagate.
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
      await useAPIFetch('/api/storage', {
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
      const asyncData = await useAPIFetch<SavedAnalysis[]>('/api/storage');
      
      if (asyncData.error.value) {
        console.error('Error fetching analyses (useAPIFetch):', asyncData.error.value);
        throw asyncData.error.value; // Re-throw to be caught by the outer catch block
      }
      // data.value can be T | null. Return an empty array if null to match Promise<SavedAnalysis[]>
      return asyncData.data.value || [];
    } catch (error) {
      // Error logging is already handled if error.value was thrown
      // console.error('Error fetching analyses:', error); 
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
      await useAPIFetch(`/api/storage/${id}`, {
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
      await useAPIFetch('/api/storage', {
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
  static async saveResume(resume: ResumeEntry): Promise<string> {
    try {
      // Get current resumes
      const savedResumes = await StorageService.getResumes();
      
      // Add to the beginning of the array
      savedResumes.unshift(resume);
      
      // Keep only the latest 10 resumes
      const trimmedResumes = savedResumes.slice(0, 10);
      
      // Save to server
      await useAPIFetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimmedResumes)
      });
      
      return resume.id;
    } catch (error) {
      console.error('Error saving resume:', error);
      // Fallback to localStorage if server storage fails
      return StorageService.saveResumeToLocalStorage(resume);
    }
  }

  /**
   * Get all saved resumes
   */
 static async getResumes(): Promise<ResumeEntry[]> {
    try {
      // Fetch from server
      const asyncData = await useAPIFetch<ResumeEntry[]>('/api/resumes');

      if (asyncData.error.value) {
        console.error('Error fetching resumes (useAPIFetch):', asyncData.error.value);
        throw asyncData.error.value; // Re-throw to be caught by the outer catch block
      }
      // data.value can be T | null. Return an empty array if null.
      return asyncData.data.value || [];
    } catch (error) {
      // console.error('Error fetching resumes:', error);
      // Fallback to localStorage if server fetch fails
      return StorageService.getResumesFromLocalStorage();
    }
  }

  /**
   * Delete a specific resume
   */
  static async deleteResume(id: string): Promise<void> {
    try {
      // Delete from server
      await useAPIFetch(`/api/resumes/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      // Fallback to localStorage if server delete fails
      StorageService.deleteResumeFromLocalStorage(id);
    }
  }

  /**
   * Clear all saved resumes
   */
  static async clearResumes(): Promise<void> {
    try {
      // Clear from server
      await useAPIFetch('/api/resumes', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error clearing resumes:', error);
      // Fallback to localStorage if server clear fails
      StorageService.clearResumesFromLocalStorage();
    }
  }

  /**
   * Get all saved cover letter samples
   */
  static async getCoverLetterSamples(): Promise<Array<{ id: string; name: string; content: string; notes: string; timestamp: string }>> {
    try {
      // Fetch from server
      const asyncData = await useAPIFetch<Array<{ id: string; name: string; content: string; notes: string; timestamp: string }>>('/api/cover-letter-samples');

      if (asyncData.error.value) {
        console.error('Error fetching cover letter samples (useAPIFetch):', asyncData.error.value);
        throw asyncData.error.value;
      }
      return asyncData.data.value || [];
    } catch (error) {
      return StorageService.getCoverLetterSamplesFromLocalStorage();
    }
  }

  /**
   * Delete a specific cover letter sample
   */
  static async deleteCoverLetterSample(id: string): Promise<void> {
    try {
      // Delete from server
      await useAPIFetch(`/api/cover-letter-samples/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting cover letter sample:', error);
      // Fallback to localStorage if server delete fails
      StorageService.deleteCoverLetterSampleFromLocalStorage(id);
    }
  }
  
  // --- Fallback localStorage methods ---
  
  private static STORAGE_KEY = 'job-analysis-history';
  
  private static saveAnalysisToLocalStorage(result: AnalysisResult, jobPosting: JobPosting, resume: Resume): SavedAnalysis {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot save analysis to localStorage fallback.');
      throw new Error('localStorage not available for fallback save of analysis.');
    }
    const savedAnalyses = StorageService.getAnalysesFromLocalStorage();
    
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
    if (typeof localStorage === 'undefined') {
      // This might be called during SSR if the primary fetch fails.
      // console.warn('localStorage not available, cannot get analyses from localStorage fallback.');
      return [];
    }
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
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot delete analysis from localStorage fallback.');
      return;
    }
    const savedAnalyses = this.getAnalysesFromLocalStorage();
    const updatedAnalyses = savedAnalyses.filter(analysis => analysis.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedAnalyses));
  }
  
  private static clearAnalysesFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot clear analyses from localStorage fallback.');
      return;
    }
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  // --- Fallback localStorage methods for resumes ---
  
  private static RESUMES_STORAGE_KEY = 'saved-resumes';
  
  private static saveResumeToLocalStorage(resume: ResumeEntry): string {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot save resume to localStorage fallback.');
      throw new Error('localStorage not available for fallback save of resume.');
    }
    const savedResumes = StorageService.getResumesFromLocalStorage();
    
    savedResumes.unshift(resume);
    
    // Keep only the latest 10 resumes
    const trimmedResumes = savedResumes.slice(0, 10);
    localStorage.setItem(StorageService.RESUMES_STORAGE_KEY, JSON.stringify(trimmedResumes));
    
    return resume.id;
  }
  
  private static getResumesFromLocalStorage(): ResumeEntry[] {
    if (typeof localStorage === 'undefined') {
      // console.warn('localStorage not available, cannot get resumes from localStorage fallback.');
      return [];
    }
    const data = localStorage.getItem(StorageService.RESUMES_STORAGE_KEY);
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse saved resumes from localStorage:', e);
      return [];
    }
  }
  
  private static deleteResumeFromLocalStorage(id: string): void {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot delete resume from localStorage fallback.');
      return;
    }
    const savedResumes = StorageService.getResumesFromLocalStorage();
    const updatedResumes = savedResumes.filter(resume => resume.id !== id);
    localStorage.setItem(StorageService.RESUMES_STORAGE_KEY, JSON.stringify(updatedResumes));
  }
  
  private static clearResumesFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot clear resumes from localStorage fallback.');
      return;
    }
    localStorage.removeItem(StorageService.RESUMES_STORAGE_KEY);
  }
  
  // --- Fallback localStorage methods for cover letter samples ---
  
  private static COVER_LETTER_SAMPLES_STORAGE_KEY = 'saved-cover-letter-samples';
  
  private static saveCoverLetterSampleToLocalStorage(sample: { content: string; name: string; notes: string }): string {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot save cover letter sample to localStorage fallback.');
      throw new Error('localStorage not available for fallback save of cover letter sample.');
    }
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
    if (typeof localStorage === 'undefined') {
      // console.warn('localStorage not available, cannot get cover letter samples from localStorage fallback.');
      return [];
    }
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
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot delete cover letter sample from localStorage fallback.');
      return;
    }
    const savedSamples = this.getCoverLetterSamplesFromLocalStorage();
    const updatedSamples = savedSamples.filter(sample => sample.id !== id);
    localStorage.setItem(this.COVER_LETTER_SAMPLES_STORAGE_KEY, JSON.stringify(updatedSamples));
  }
  
  private static clearCoverLetterSamplesFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot clear cover letter samples from localStorage fallback.');
      return;
    }
    localStorage.removeItem(StorageService.COVER_LETTER_SAMPLES_STORAGE_KEY);
  }
  
  // ===== CONVERSATION MANAGEMENT =====
  
  private static readonly CONVERSATIONS_STORAGE_KEY = 'coverLetterConversations';

  /**
   * Save a conversation to storage
   */
  static async saveConversation(conversation: CoverLetterConversation): Promise<void> {
    try {
      // Try to save to server first
      const response = await StorageService.fetchWithBaseUrl('/api/storage/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversation)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save conversation: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving conversation to server, falling back to localStorage:', error);
      // Fallback to localStorage
      StorageService.saveConversationToLocalStorage(conversation);
    }
  }

  /**
   * Get a conversation by ID
   */
  static async getConversation(id: string): Promise<CoverLetterConversation | null> {
    try {
      const conversations = await StorageService.getConversations();
      return conversations.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error getting conversation:', error);
      return StorageService.getConversationFromLocalStorage(id);
    }
  }

  /**
   * Get all conversations
   */
  static async getConversations(): Promise<CoverLetterConversation[]> {
    try {
      const response = await StorageService.fetchWithBaseUrl('/api/storage/conversations');
      if (response.ok) {
        return await response.json();
      } else {
        console.warn('Server storage not available for conversations, falling back to localStorage');
        return StorageService.getConversationsFromLocalStorage();
      }
    } catch (error) {
      console.error('Error getting conversations from server, falling back to localStorage:', error);
      return StorageService.getConversationsFromLocalStorage();
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(id: string): Promise<void> {
    try {
      const conversations = await StorageService.getConversations();
      const filtered = conversations.filter(c => c.id !== id);
      
      const response = await StorageService.fetchWithBaseUrl('/api/storage/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filtered)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting conversation from server, falling back to localStorage:', error);
      StorageService.deleteConversationFromLocalStorage(id);
    }
  }

  /**
   * Link a conversation to an analysis
   */
  static async linkConversationToAnalysis(analysisId: string, conversationId: string): Promise<void> {
    try {
      const analyses = await StorageService.getAnalyses();
      const analysis = analyses.find(a => a.id === analysisId);
      
      if (analysis) {
        analysis.conversationId = conversationId;
        
        // Save the updated analysis
        const response = await StorageService.fetchWithBaseUrl('/api/storage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analyses)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to link conversation to analysis: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error linking conversation to analysis:', error);
      // Handle localStorage fallback if needed
    }
  }

  // ===== CONVERSATION LOCALSTORAGE FALLBACK METHODS =====

  private static saveConversationToLocalStorage(conversation: CoverLetterConversation): void {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot save conversation to localStorage fallback.');
      return;
    }
    
    try {
      const conversations = StorageService.getConversationsFromLocalStorage();
      const index = conversations.findIndex(c => c.id === conversation.id);
      
      if (index >= 0) {
        conversations[index] = conversation;
      } else {
        conversations.push(conversation);
      }
      
      localStorage.setItem(StorageService.CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversation to localStorage:', error);
      // Don't throw - gracefully handle localStorage errors
    }
  }

  private static getConversationFromLocalStorage(id: string): CoverLetterConversation | null {
    const conversations = StorageService.getConversationsFromLocalStorage();
    return conversations.find(c => c.id === id) || null;
  }

  private static getConversationsFromLocalStorage(): CoverLetterConversation[] {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, returning empty conversations array.');
      return [];
    }
    
    try {
      const data = localStorage.getItem(StorageService.CONVERSATIONS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading conversations from localStorage:', error);
      return [];
    }
  }

  private static deleteConversationFromLocalStorage(id: string): void {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot delete conversation from localStorage fallback.');
      return;
    }
    
    try {
      const conversations = StorageService.getConversationsFromLocalStorage();
      const filtered = conversations.filter(c => c.id !== id);
      localStorage.setItem(StorageService.CONVERSATIONS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting conversation from localStorage:', error);
      // Don't throw - gracefully handle localStorage errors
    }
  }
}
