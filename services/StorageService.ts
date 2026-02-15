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
      if (process.env.NODE_ENV !== 'production') {
        // In development mode on the server, attempt to construct a default base URL.
        // Nuxt/Nitro often sets NITRO_HOST and NITRO_PORT.
        const host = process.env.NITRO_HOST || 'localhost';
        const port = process.env.NITRO_PORT || process.env.PORT || '3001'; // PORT is a common env var, 3001 is Nuxt's default.
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

  private static async fetchWithBaseUrl(path: string, options?: RequestInit, event?: any) {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      // getBaseUrl() already logs an error if it returns an empty string.
      throw new Error(`Cannot fetch from API: Base URL is not configured or could not be determined. Attempted path: ${path}`);
    }
    
    if (process.client) {
      const { data, error } = await useAPIFetch(path, options);
      if (error.value) {
        throw error.value;
      }
      return data.value;
    } else {
      const headers: HeadersInit = { ...options?.headers };
      if (event) {
        const authHeader = event.node.req.headers['authorization'];
        if (authHeader) {
          headers['authorization'] = authHeader;
        }
      }
      return $fetch(path, { ...options, headers, baseURL: baseUrl });
    }
  }

  /**
   * Save an analysis result to file storage
   */
  static async saveAnalysis(result: AnalysisResult, jobPosting: JobPosting, resume: Resume, event?: any): Promise<SavedAnalysis> {
    try {
      // First, ensure resume and job posting exist in database
      let resumeId: string;
      let jobPostingId: string;
      
      // Check if resume has an ID (already in database)
      if ((resume as any).id) {
        resumeId = (resume as any).id;
      } else {
        // Create resume in database
        const resumeResponse = await this.fetchWithBaseUrl('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Resume ' + new Date().toISOString(),
            content: resume.content,
            metadata: {}
          })
        }, event);
        resumeId = (resumeResponse as any).id;
      }
      
      // Check if job posting has an ID (already in database)
      if ((jobPosting as any).id) {
        jobPostingId = (jobPosting as any).id;
      } else {
        // Create job posting in database
        const jobPostingResponse = await this.fetchWithBaseUrl('/api/job-postings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: jobPosting.title || 'Untitled Job',
            company: (jobPosting as any).company,
            content: jobPosting.content,
            url: (jobPosting as any).url,
            location: (jobPosting as any).location,
            salaryRange: (jobPosting as any).salaryRange,
            metadata: {}
          })
        }, event);
        jobPostingId = (jobPostingResponse as any).id;
      }
      
      // Create analysis in database
      const analysisResponse = await this.fetchWithBaseUrl('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          jobPostingId,
          matches: result.matches || [],
          gaps: result.gaps || [],
          suggestions: result.suggestions || [],
          analysisMetadata: {}
        })
      }, event);
      
      const analysis = analysisResponse as any;
      
      // Convert to SavedAnalysis format
      const savedAnalysis: SavedAnalysis = {
        id: analysis.id,
        matches: analysis.matches || [],
        gaps: analysis.gaps || [],
        suggestions: analysis.suggestions || [],
        timestamp: analysis.createdAt || new Date().toISOString(),
        jobTitle: analysis.jobPosting?.title,
        company: analysis.jobPosting?.company,
        resumeSnippet: resume.content.substring(0, 100) + (resume.content.length > 100 ? '...' : ''),
        jobPosting: {
          title: jobPosting.title,
          content: jobPosting.content
        },
        resume: {
          content: resume.content
        }
      };
      
      // Update localStorage cache
      const localAnalyses = this.getAnalysesFromLocalStorage();
      localAnalyses.unshift(savedAnalysis);
      this.syncAnalysesToLocalStorage(localAnalyses.slice(0, 10));
      
      return savedAnalysis;
    } catch (error) {
      console.error('Error saving analysis:', error);
      // Fallback to localStorage if server storage fails
      return this.saveAnalysisToLocalStorage(result, jobPosting, resume);
    }
  }
  
  /**
   * Save a cover letter for an analysis
   */
  static async saveCoverLetter(analysisId: string, coverLetter: CoverLetter, event?: any): Promise<void> {
    try {
      // Note: New API doesn't have cover letter storage yet
      // For now, update localStorage only
      const savedAnalyses = this.getAnalysesFromLocalStorage();
      const analysisIndex = savedAnalyses.findIndex(a => a.id === analysisId);
      
      if (analysisIndex === -1) {
        throw new Error('Analysis not found');
      }
      
      savedAnalyses[analysisIndex].coverLetter = coverLetter;
      this.syncAnalysesToLocalStorage(savedAnalyses);
      
    } catch (error) {
      console.error('Error saving cover letter:', error);
      throw error;
    }
  }
  
  /**
   * Get all saved analyses
   */
  static async getAnalyses(event?: any): Promise<SavedAnalysis[]> {
    try {
      console.log('[StorageService] Fetching analyses from API...');
      const response = await this.fetchWithBaseUrl('/api/analysis', {}, event);
      console.log('[StorageService] API response type:', typeof response);

      // New API returns { analysisResults: [], pagination: {} }
      if (response && typeof response === 'object' && 'analysisResults' in response) {
        const analyses = (response as any).analysisResults;
        console.log(`[StorageService] Successfully fetched ${analyses.length} analyses from server`);
        
        // Convert database format to SavedAnalysis format
        const converted = analyses.map((a: any) => ({
          id: a.id,
          matches: a.matches || [],
          gaps: a.gaps || [],
          suggestions: a.suggestions || [],
          timestamp: a.createdAt || new Date().toISOString(),
          jobTitle: a.jobPosting?.title,
          company: a.jobPosting?.company,
          resumeSnippet: a.resume?.content?.substring(0, 100) + '...',
          jobPosting: {
            title: a.jobPosting?.title || '',
            content: a.jobPosting?.content || ''
          },
          resume: {
            content: a.resume?.content || ''
          }
        }));
        
        const normalized = this.normalizeAnalyses(converted);
        this.syncAnalysesToLocalStorage(normalized);
        return normalized;
      }
      // Fallback for old API format (array)
      else if (Array.isArray(response)) {
        console.log(`[StorageService] Successfully fetched ${response.length} analyses from server (legacy format)`);
        const normalized = this.normalizeAnalyses(response as SavedAnalysis[]);
        this.syncAnalysesToLocalStorage(normalized);
        return normalized;
      }
      else {
        console.error('[StorageService] ERROR: Server returned unexpected response:', typeof response, response);
        console.warn('[StorageService] Falling back to localStorage');
        return this.getAnalysesFromLocalStorage();
      }
    } catch (error) {
      console.error('[StorageService] Failed to fetch analyses from server:', error);
      console.error('[StorageService] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[StorageService] Error message:', error instanceof Error ? error.message : String(error));
      console.warn('[StorageService] Using localStorage cache');
      return this.getAnalysesFromLocalStorage();
    }
  }
  
  /**
   * Delete a specific analysis
   */
  static async deleteAnalysis(id: string, event?: any): Promise<void> {
    try {
      // Note: New API doesn't have a delete endpoint for analysis yet
      // For now, just remove from localStorage
      this.deleteAnalysisFromLocalStorage(id);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      // Fallback to localStorage if server delete fails
      this.deleteAnalysisFromLocalStorage(id);
    }
  }
  
  /**
   * Clear all saved analyses
   */
  static async clearAnalyses(event?: any): Promise<void> {
    try {
      // Note: New API doesn't have a clear all endpoint
      // For now, just clear localStorage
      this.clearAnalysesFromLocalStorage();
    } catch (error) {
      console.error('Error clearing analyses:', error);
      // Fallback to localStorage if server clear fails
      this.clearAnalysesFromLocalStorage();
    }
  }
  
  /**
   * Save a resume to storage
   */
  static async saveResume(resume: ResumeEntry, event?: any): Promise<string> {
    try {
      // New API expects individual resume creation
      const response = await this.fetchWithBaseUrl('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: resume.name,
          content: resume.content,
          metadata: {}
        })
      }, event);
      
      // Return the ID from the created resume
      return (response as any).id || resume.id;
    } catch (error) {
      console.error('Error saving resume:', error);
      // Fallback to localStorage if server storage fails
      return StorageService.saveResumeToLocalStorage(resume);
    }
  }

  /**
   * Get all saved resumes
   */
 static async getResumes(event?: any): Promise<ResumeEntry[]> {
    try {
      console.log('[StorageService] Fetching resumes from API...');
      const response = await this.fetchWithBaseUrl('/api/resumes', {}, event);
      console.log('[StorageService] API response type:', typeof response);

      // New API returns { resumes: [], pagination: {} }
      if (response && typeof response === 'object' && 'resumes' in response) {
        const resumes = (response as any).resumes;
        console.log(`[StorageService] Successfully fetched ${resumes.length} resumes from server`);
        
        // Convert database format to ResumeEntry format
        return resumes.map((r: any) => ({
          id: r.id,
          name: r.name,
          content: r.content,
          timestamp: r.createdAt || new Date().toISOString()
        }));
      } 
      // Fallback for old API format (array)
      else if (Array.isArray(response)) {
        console.log(`[StorageService] Successfully fetched ${response.length} resumes from server (legacy format)`);
        return response as ResumeEntry[];
      } 
      else {
        console.error('[StorageService] ERROR: Server returned unexpected response:', typeof response, response);
        console.warn('[StorageService] Falling back to localStorage for resumes');
        const localResumes = StorageService.getResumesFromLocalStorage();
        console.log(`[StorageService] localStorage returned ${localResumes.length} resumes`);
        return localResumes;
      }
    } catch (error) {
      console.error('[StorageService] Error fetching resumes from server:', error);
      console.error('[StorageService] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[StorageService] Error message:', error instanceof Error ? error.message : String(error));
      console.warn('[StorageService] Falling back to localStorage for resumes');
      const localResumes = StorageService.getResumesFromLocalStorage();
      console.log(`[StorageService] localStorage returned ${localResumes.length} resumes`);
      return localResumes;
    }
  }

  /**
   * Delete a specific resume
   */
  static async deleteResume(id: string, event?: any): Promise<void> {
    try {
      // Delete from server
      await this.fetchWithBaseUrl(`/api/resumes/${id}`, {
        method: 'DELETE'
      }, event);
    } catch (error) {
      console.error('Error deleting resume:', error);
      // Fallback to localStorage if server delete fails
      StorageService.deleteResumeFromLocalStorage(id);
    }
  }

  /**
   * Clear all saved resumes
   */
  static async clearResumes(event?: any): Promise<void> {
    try {
      // Clear from server
      await this.fetchWithBaseUrl('/api/resumes', {
        method: 'DELETE'
      }, event);
    } catch (error) {
      console.error('Error clearing resumes:', error);
      // Fallback to localStorage if server clear fails
      StorageService.clearResumesFromLocalStorage();
    }
  }

  /**
   * Get all saved cover letter samples
   */
  static async getCoverLetterSamples(event?: any): Promise<Array<{ id: string; name: string; content: string; notes: string; timestamp: string }>> {
    try {
      // Fetch from server, adding a unique key to bypass caching
      const samples = await this.fetchWithBaseUrl('/api/cover-letter-samples', { key: `cls-${Date.now()}` }, event);
      return (samples as Array<{ id: string; name: string; content: string; notes: string; timestamp: string }>) || [];
    } catch (error) {
      return StorageService.getCoverLetterSamplesFromLocalStorage();
    }
  }

  /**
   * Delete a specific cover letter sample
   */
  static async deleteCoverLetterSample(id: string, event?: any): Promise<void> {
    try {
      // Delete from server
      await this.fetchWithBaseUrl(`/api/cover-letter-samples/${id}`, {
        method: 'DELETE'
      }, event);
    } catch (error) {
      console.error('Error deleting cover letter sample:', error);
      // Fallback to localStorage if server delete fails
      StorageService.deleteCoverLetterSampleFromLocalStorage(id);
    }
  }
  
  // --- Fallback localStorage methods ---
  
  private static STORAGE_KEY = 'job-analysis-history';

  private static normalizeAnalyses(analyses?: SavedAnalysis[] | null): SavedAnalysis[] {
    if (!Array.isArray(analyses)) {
      return [];
    }

    return [...analyses]
      .filter((analysis): analysis is SavedAnalysis => Boolean(analysis))
      .sort((a, b) => {
        const aTime = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });
  }

  private static syncAnalysesToLocalStorage(analyses: SavedAnalysis[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    this.setAnalysesToLocalStorage(analyses);
    console.debug('StorageService: Synchronized analyses to local cache.');
  }

  private static setAnalysesToLocalStorage(analyses: SavedAnalysis[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(analyses));
    } catch (error) {
      console.warn('StorageService: Failed to write analyses to localStorage.', error);
    }
  }
  
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
    this.setAnalysesToLocalStorage(trimmedAnalyses);
    
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
      return this.normalizeAnalyses(JSON.parse(data));
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
  static async saveConversation(conversation: CoverLetterConversation, event?: any): Promise<void> {
    try {
      // Try to save to server first
      await this.fetchWithBaseUrl('/api/storage/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversation)
      }, event);
      
    } catch (error) {
      console.error('Error saving conversation to server, falling back to localStorage:', error);
      // Fallback to localStorage
      StorageService.saveConversationToLocalStorage(conversation);
    }
  }

  /**
   * Get a conversation by ID
   */
  static async getConversation(id: string, event?: any): Promise<CoverLetterConversation | null> {
    try {
      const conversations = await StorageService.getConversations(event);
      return conversations.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error getting conversation:', error);
      return StorageService.getConversationFromLocalStorage(id);
    }
  }

  /**
   * Get all conversations
   */
  static async getConversations(event?: any): Promise<CoverLetterConversation[]> {
    try {
      console.log('[StorageService] Fetching conversations from API...');
      const response = await this.fetchWithBaseUrl('/api/storage/conversations', {}, event);
      console.log('[StorageService] API response type:', typeof response, 'isArray:', Array.isArray(response));
      
      if (response) {
        // Validate that response is an array
        if (Array.isArray(response)) {
          console.log(`[StorageService] Successfully fetched ${response.length} conversations from server`);
          return response as CoverLetterConversation[];
        } else {
          console.error('[StorageService] ERROR: Server returned non-array response:', typeof response, response);
          console.warn('[StorageService] Falling back to localStorage due to invalid server response');
          return StorageService.getConversationsFromLocalStorage();
        }
      } else {
        console.warn('[StorageService] Server returned null/undefined, falling back to localStorage');
        return StorageService.getConversationsFromLocalStorage();
      }
    } catch (error) {
      console.error('[StorageService] Error getting conversations from server:', error);
      console.error('[StorageService] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[StorageService] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[StorageService] Falling back to localStorage');
      return StorageService.getConversationsFromLocalStorage();
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(id: string, event?: any): Promise<void> {
    try {
      const conversations = await StorageService.getConversations(event);
      const filtered = conversations.filter(c => c.id !== id);
      
      await this.fetchWithBaseUrl('/api/storage/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filtered)
      }, event);
      
    } catch (error) {
      console.error('Error deleting conversation from server, falling back to localStorage:', error);
      StorageService.deleteConversationFromLocalStorage(id);
    }
  }

  /**
   * Link a conversation to an analysis
   */
  static async linkConversationToAnalysis(analysisId: string, conversationId: string, event?: any): Promise<void> {
    try {
      const analyses = await StorageService.getAnalyses(event);
      const analysis = analyses.find(a => a.id === analysisId);
      
      if (analysis) {
        analysis.conversationId = conversationId;
        
        // Save the updated analysis
        await this.fetchWithBaseUrl('/api/storage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analyses)
        }, event);
        
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
