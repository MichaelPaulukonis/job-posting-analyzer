import type { AnalysisResult } from '../types';

/**
 * Parse Gemini API response
 */
export function parseGeminiResponse(text: string): AnalysisResult {
  try {
    // Default empty results
    const result: AnalysisResult = {
      matches: [],
      maybes: [],
      gaps: [],
      suggestions: [],
      timestamp: new Date().toISOString()
    };
    
    // Parse response sections (1. Matches, 2. Maybes 3. Gaps, 4. Suggestions)
    const sections = text.split(/\n\d+\./).filter(section => section.trim().length > 0);
    
    if (sections.length >= 4) {
      result.matches = extractListItems(sections[0]);
      result.maybes = extractListItems(sections[1]);
      result.gaps = extractListItems(sections[2]);
      result.suggestions = extractListItems(sections[3]);
    } else {
      // Fallback parser for unexpected format
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Try to categorize lines into matches, maybes, gaps, and suggestions
      // TODO: heuristic for maybes
      // the heuristic for all of this is sketchy at best
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
      maybes: ['Did you upload the correct files?'],
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
      .filter(line => line.length > 0 && !line.match(/^(matches|maybes|gaps|suggestions):/i));
  }
  
  return matches;
}
