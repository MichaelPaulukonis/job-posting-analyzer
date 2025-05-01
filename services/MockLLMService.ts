import type { AnalysisResult, JobPosting, Resume } from '../types';
import type { LLMServiceInterface } from './LLMServiceInterface';
import { createAnalysisPrompt } from '../utils/promptUtils';

export class MockLLMService implements LLMServiceInterface {
  private delay: number;
  
  constructor(delay = 1500) {
    this.delay = delay;
  }
  
  async analyzeJobPosting(jobPosting: JobPosting, resume: Resume): Promise<AnalysisResult> {
    // Log the prompt for debugging
    console.log('Generated prompt:', createAnalysisPrompt(jobPosting, resume));
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, this.delay));
    
    // Extract some keywords from the job posting to simulate matching
    const jobKeywords = this.extractKeywords(jobPosting.content);
    const resumeKeywords = this.extractKeywords(resume.content);
    
    // Find matches and gaps
    const matches = jobKeywords.filter(keyword => 
      resumeKeywords.some(rk => rk.toLowerCase() === keyword.toLowerCase())
    );
    
    const gaps = jobKeywords.filter(keyword => 
      !resumeKeywords.some(rk => rk.toLowerCase() === keyword.toLowerCase())
    );
    
    // Generate mock suggestions
    const suggestions = this.generateSuggestions(gaps);
    
    return {
      matches,
      gaps,
      suggestions,
      timestamp: new Date().toISOString()
    };
  }
  
  getServiceName(): string {
    return 'Mock LLM Analyzer';
  }
  
  async isAvailable(): Promise<boolean> {
    return true;
  }
  
  private extractKeywords(text: string): string[] {
    // This is a very simple implementation that just extracts some words
    // A real implementation would be more sophisticated
    
    // List of common technical skills and qualifications
    const knownSkills = [
      'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 
      'Python', 'Java', 'C#', 'HTML', 'CSS', 'SQL', 'NoSQL', 'Docker',
      'AWS', 'Azure', 'GCP', 'Kubernetes', 'REST API', 'GraphQL',
      'Agile', 'Scrum', 'CI/CD', 'Git', 'TDD', 'Redux', 'MongoDB',
      'MySQL', 'PostgreSQL', 'DevOps', 'Microservices', 'OOP',
      'Functional Programming', 'Unit Testing', 'Responsive Design'
    ];
    
    // Extract skills that appear in the text
    const foundSkills = knownSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    
    // Add some random years of experience requirements if this is a job posting
    if (foundSkills.length > 0 && Math.random() > 0.5) {
      const randomSkill = foundSkills[Math.floor(Math.random() * foundSkills.length)];
      const years = Math.floor(Math.random() * 5) + 1;
      foundSkills.push(`${years}+ years of ${randomSkill}`);
    }
    
    return foundSkills;
  }
  
  private generateSuggestions(gaps: string[]): string[] {
    if (gaps.length === 0) {
      return ['Your resume already covers all the required skills!'];
    }
    
    const suggestions = [
      `Add the following missing skills to your resume: ${gaps.join(', ')}`,
      'Consider restructuring your resume to highlight relevant experience',
      'Quantify your achievements with metrics where possible'
    ];
    
    // Add specific suggestions for each gap
    gaps.forEach(gap => {
      if (Math.random() > 0.3) {  // Only add for some gaps to avoid too many suggestions
        suggestions.push(`Consider adding experience or projects that demonstrate your ${gap} skills`);
      }
    });
    
    return suggestions;
  }
}
