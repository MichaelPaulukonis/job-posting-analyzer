import type { AnalysisResult } from '../types';

/**
 * Parse Gemini API response
 */
export function parseGeminiResponse(text: string): AnalysisResult {
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
      result.matches = extractListItems(sections[0]);
      
      // Extract gaps from the second section
      result.gaps = extractListItems(sections[1]);
      
      // Extract suggestions from the third section
      result.suggestions = extractListItems(sections[2]);
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
    return {
      matches: ['Error parsing response from AI'],
      gaps: ['Please try again or check console for details'],
      suggestions: ['Consider using a different LLM model'],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Extract list items from text
 */
export function extractListItems(text: string): string[] {
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
