import type { AnalysisResult, JobPosting, Resume } from '../types';
import type { LLMServiceInterface } from './LLMServiceInterface';
import { createAnalysisPrompt } from '../utils/promptUtils';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiLLMService implements LLMServiceInterface {
  private ai: GoogleGenerativeAI;
  private model: string;
  
  constructor(apiKey: string, model: string = 'gemini-pro') {
    this.ai = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }
  
  async analyzeJobPosting(jobPosting: JobPosting, resume: Resume): Promise<AnalysisResult> {
    try {
      const prompt = createAnalysisPrompt(jobPosting, resume);
      
      // Get Gemini model
      const geminiModel = this.ai.getGenerativeModel({ model: this.model });
      
      // Generate content
      const result = await geminiModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Process the response
      return this.parseResponseText(text);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to analyze job posting using Gemini AI');
    }
  }
  
  getServiceName(): string {
    return 'Google Gemini AI';
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      // Check if API key is available
      return !!process.env.GEMINI_API_KEY;
    } catch (error) {
      return false;
    }
  }
  
  private parseResponseText(text: string): AnalysisResult {
    try {
      // Default empty results
      const result: AnalysisResult = {
        matches: [],
        gaps: [],
        suggestions: [],
        timestamp: new Date().toISOString()
      };
      
      // Parse response sections (1. Matches, 2. Gaps, 3. Suggestions)
      const sections = text.split(/\n\d+\./).filter(section => section.trim().length > 0);
      
      if (sections.length >= 3) {
        // Extract matches from the first section
        result.matches = this.extractListItems(sections[0]);
        
        // Extract gaps from the second section
        result.gaps = this.extractListItems(sections[1]);
        
        // Extract suggestions from the third section
        result.suggestions = this.extractListItems(sections[2]);
      } else {
        // Fallback parser for unexpected format
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Try to categorize lines into matches, gaps, and suggestions
        for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('match') && !lowerLine.includes('no match')) {
            result.matches.push(line);
          } else if (lowerLine.includes('missing') || lowerLine.includes('gap') || lowerLine.includes('lack')) {
            result.gaps.push(line);
          } else if (lowerLine.includes('suggest') || lowerLine.includes('improve') || lowerLine.includes('add')) {
            result.suggestions.push(line);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      // Return a default response in case of parsing errors
      return {
        matches: ['Error parsing response from AI'],
        gaps: ['Please try again or check console for details'],
        suggestions: ['Consider using a different LLM model'],
        timestamp: new Date().toISOString()
      };
    }
  }
  
  private extractListItems(text: string): string[] {
    // Extract items that look like list items (with dashes, bullets, or numbers)
    const listItemRegex = /(?:^|\n)[•\-*]\s*(.+?)(?=\n|$)/g;
    const matches = Array.from(text.matchAll(listItemRegex), match => match[1].trim());
    
    // If no matches found with bullet points, try splitting by newlines
    if (matches.length === 0) {
      return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^(matches|gaps|suggestions):/i));
    }
    
    return matches;
  }
}
