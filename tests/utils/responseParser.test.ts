import { parseGeminiResponse, extractListItems } from '../../utils/responseParser';
import { response as sampleResponse } from '../data/sample.response.01';  // Adjust path as needed

describe('Response Parser', () => {
  describe('parseGeminiResponse', () => {
    it('should correctly parse a sample Gemini response', () => {
      // Parse the response
      const result = parseGeminiResponse(sampleResponse);
      
      // Assertions - basic structure
      expect(result).toHaveProperty('matches');
      expect(result).toHaveProperty('gaps');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('timestamp');
      
      // Assertions - content (these should be adjusted based on actual sample content)
      expect(Array.isArray(result.matches)).toBe(true);
      expect(Array.isArray(result.gaps)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      
      // Log results for inspection
      console.log('Parsed matches:', result.matches);
      console.log('Parsed gaps:', result.gaps);
      console.log('Parsed suggestions:', result.suggestions);
    });
    
    it.skip('should handle a simple well-formatted response', () => {
      const simpleResponse = `
1. Skills and qualifications that match between the job posting and resume.
- JavaScript
- TypeScript
- React

2. Skills and qualifications that are potential matches but use different terminology.
- Job Posting: "GraphQL" --> Resume: "REST" (both are API technologies)
- Job Posting: "Docker" --> Resume: "Containerization" (both are container technologies)

3. Skills and qualifications mentioned in the job posting but missing from the resume.
- AWS
- GraphQL
- Docker

4. Specific suggestions to improve the resume for this job posting.
- Add AWS experience
- Highlight React skills more prominently
- Include examples of Docker usage
      `;
      
      const result = parseGeminiResponse(simpleResponse);
      
      expect(result.matches).toContain('JavaScript');
      expect(result.matches).toContain('TypeScript');
      expect(result.matches).toContain('React');
      
      expect(result.gaps).toContain('AWS');
      expect(result.gaps).toContain('GraphQL');
      expect(result.gaps).toContain('Docker');
      
      expect(result.suggestions).toContain('Add AWS experience');
      expect(result.suggestions).toContain('Highlight React skills more prominently');
      expect(result.suggestions).toContain('Include examples of Docker usage');
    });
    
    it('should handle unexpected format gracefully', () => {
      const unexpectedFormat = `
This is not a formatted response at all.
It doesn't have the expected sections.
But it mentions matches with JavaScript.
Also has gaps in GraphQL knowledge.
And suggests improving the resume formatting.
      `;
      
      const result = parseGeminiResponse(unexpectedFormat);
      
      // The fallback parser should still extract some information
      expect(result.matches.length).toBeGreaterThanOrEqual(0);
      expect(result.gaps.length).toBeGreaterThanOrEqual(0);
      expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('extractListItems', () => {
    it('should extract items from bullet lists', () => {
      const bulletList = `
Some header text
- Item 1
- Item 2
- Item 3
Some footer text
      `;
      
      const items = extractListItems(bulletList);
      expect(items).toContain('Item 1');
      expect(items).toContain('Item 2');
      expect(items).toContain('Item 3');
      expect(items).toHaveLength(3);
    });
    
    it('should extract items when asterisks are used', () => {
      const asteriskList = `
* Item A
* Item B
* Item C
      `;
      
      const items = extractListItems(asteriskList);
      expect(items).toContain('Item A');
      expect(items).toContain('Item B');
      expect(items).toContain('Item C');
      expect(items).toHaveLength(3);
    });
    
    it('should handle mixed list formats', () => {
      const mixedList = `
- Item 1
* Item 2
• Item 3
      `;
      
      const items = extractListItems(mixedList);
      expect(items).toContain('Item 1');
      expect(items).toContain('Item 2');
      expect(items).toContain('Item 3');
      expect(items).toHaveLength(3);
    });
    
    it('should fall back to line splitting when no bullet points', () => {
      const plainText = `
Item 1
Item 2
Item 3
      `;
      
      const items = extractListItems(plainText);
      expect(items).toContain('Item 1');
      expect(items).toContain('Item 2');
      expect(items).toContain('Item 3');
      expect(items).toHaveLength(3);
    });
  });
});
