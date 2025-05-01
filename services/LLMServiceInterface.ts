import type { AnalysisResult, JobPosting, Resume } from '../types';

/**
 * Interface for LLM service implementations
 */
export interface LLMServiceInterface {
  /**
   * Analyze a job posting against a resume
   */
  analyzeJobPosting(jobPosting: JobPosting, resume: Resume): Promise<AnalysisResult>;
  
  /**
   * Get the name of the LLM service
   */
  getServiceName(): string;
  
  /**
   * Check if the service is available/ready
   */
  isAvailable(): Promise<boolean>;
}
