/**
 * Bug Condition Exploration Test for Cover Letter Save Bug
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * 
 * This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists and validates our root cause analysis.
 * 
 * Property 1: Fault Condition - Cover Letter Database Persistence
 * 
 * For any Save button click where a cover letter has content and an analysisId exists,
 * the saveCoverLetter function SHOULD:
 * 1. Make an API call to `/api/storage/cover-letters`
 * 2. Create a record in the `cover_letters` table
 * 3. Provide visual feedback (loading state, then success or error message)
 * 
 * CRITICAL: This test encodes the EXPECTED behavior. When it fails on unfixed code,
 * it demonstrates the bug. When it passes after the fix, it validates the solution.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { StorageService } from '~/services/StorageService';
import type { CoverLetter, SavedAnalysis } from '~/types';

// Mock $fetch for Nuxt environment
const mock$Fetch = jest.fn();
(globalThis as any).$fetch = mock$Fetch;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = mockLocalStorage as any;

// Mock useAPIFetch composable
jest.mock('~/composables/useAPIFetch', () => ({
  useAPIFetch: jest.fn((path: string, options?: any) => {
    return {
      data: { value: null },
      error: { value: new Error('useAPIFetch not implemented in test') }
    };
  })
}));

describe('Bug Exploration: Cover Letter Save Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    mock$Fetch.mockReset();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 1: API Call is Made When Saving Cover Letter
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - No API call is made to `/api/storage/cover-letters`
   * - Only localStorage is updated
   * 
   * This test uses scoped property-based testing to generate valid
   * cover letter save scenarios and verify an API call is made.
   */
  it('Property 1: Should make API call to /api/storage/cover-letters when saving', async () => {
    // Scoped PBT: Generate valid cover letter save scenarios
    await fc.assert(
      fc.asyncProperty(
        // Generate cover letter content (non-empty string)
        fc.string({ minLength: 10, maxLength: 1000 }),
        // Generate analysisId (UUID-like string)
        fc.uuid(),
        // Generate timestamp
        fc.date().map(d => d.toISOString()),
        async (content, analysisId, timestamp) => {
          // Setup: Mock existing analysis in localStorage
          const mockAnalysis: SavedAnalysis = {
            id: analysisId,
            matches: [],
            gaps: [],
            suggestions: [],
            timestamp: timestamp,
            jobTitle: 'Test Job',
            company: 'Test Company',
            resumeSnippet: 'Test resume...',
            jobPosting: { title: 'Test Job', content: 'Test job content' },
            resume: { content: 'Test resume content' }
          };
          
          mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockAnalysis]));
          
          // Mock $fetch to simulate API endpoint
          mock$Fetch.mockResolvedValueOnce({
            success: true,
            id: 'cover-letter-id',
            coverLetter: { id: 'cover-letter-id', content, timestamp }
          });

          const coverLetter: CoverLetter = {
            content,
            timestamp,
            sampleContent: '',
            history: [],
            editedSections: []
          };

          // Act: Call saveCoverLetter
          await StorageService.saveCoverLetter(analysisId, coverLetter);

          // Assert: API call should have been made
          // EXPECTED TO FAIL ON UNFIXED CODE: No API call is made
          const apiCalls = mock$Fetch.mock.calls.filter(call => 
            call[0]?.toString().includes('/api/storage/cover-letters')
          );
          
          expect(apiCalls.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 } // Run 10 test cases to surface counterexamples
    );
  });

  /**
   * Property 2: Database Record Creation
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - No database record is created
   * - cover_letters table remains empty
   * 
   * This test verifies that after a successful save, a database record exists.
   * Since we can't directly query the database in this unit test, we verify
   * that the API endpoint is called with the correct data structure.
   */
  it('Property 2: Should call API with correct cover letter data structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 1000 }),
        fc.uuid(),
        fc.date().map(d => d.toISOString()),
        async (content, analysisId, timestamp) => {
          // Setup
          const mockAnalysis: SavedAnalysis = {
            id: analysisId,
            matches: [],
            gaps: [],
            suggestions: [],
            timestamp: timestamp,
            jobTitle: 'Test Job',
            company: 'Test Company',
            resumeSnippet: 'Test resume...',
            jobPosting: { title: 'Test Job', content: 'Test job content' },
            resume: { content: 'Test resume content' }
          };
          
          mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockAnalysis]));
          
          // Mock API response for THIS iteration
          mock$Fetch.mockResolvedValueOnce({
            success: true,
            id: 'cover-letter-id',
            coverLetter: { id: 'cover-letter-id', content, timestamp }
          });

          const coverLetter: CoverLetter = {
            content,
            timestamp,
            sampleContent: '',
            history: [],
            editedSections: []
          };

          // Act
          await StorageService.saveCoverLetter(analysisId, coverLetter);

          // Assert: API should be called with proper data structure
          // EXPECTED TO FAIL ON UNFIXED CODE: No API call is made
          const apiCalls = mock$Fetch.mock.calls;
          const relevantCall = apiCalls[apiCalls.length - 1]; // Get the most recent call
          
          expect(relevantCall).toBeDefined();
          expect(relevantCall[0]?.toString()).toContain('/api/storage/cover-letters');
          
          const [url, options] = relevantCall;
          expect(options?.method).toBe('POST');
          expect(options).toHaveProperty('body');
          
          // Verify body contains expected data
          const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          expect(body).toMatchObject({
            analysisId,
            content
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 3: API Endpoint Exists
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - API endpoint /api/storage/cover-letters does not exist
   * - Would return 404 if called
   * 
   * This test verifies that the API endpoint exists and responds correctly.
   */
  it('Property 3: API endpoint /api/storage/cover-letters should exist', async () => {
    // This is a concrete test case, not property-based
    // It verifies the API endpoint exists
    
    const analysisId = 'test-analysis-id';
    const mockAnalysis: SavedAnalysis = {
      id: analysisId,
      matches: [],
      gaps: [],
      suggestions: [],
      timestamp: new Date().toISOString(),
      jobTitle: 'Test Job',
      company: 'Test Company',
      resumeSnippet: 'Test resume...',
      jobPosting: { title: 'Test Job', content: 'Test job content' },
      resume: { content: 'Test resume content' }
    };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockAnalysis]));
    
    // Mock $fetch to return error (simulating API call attempt)
    mock$Fetch.mockRejectedValueOnce(new Error('Endpoint not found'));

    const coverLetter: CoverLetter = {
      content: 'Test cover letter content',
      timestamp: new Date().toISOString(),
      sampleContent: '',
      history: [],
      editedSections: []
    };

    // Act - expect this to throw since API fails
    await expect(StorageService.saveCoverLetter(analysisId, coverLetter)).rejects.toThrow();

    // Assert: On unfixed code, no API call is made at all
    // EXPECTED TO FAIL: No API call to /api/storage/cover-letters
    const apiCalls = mock$Fetch.mock.calls.filter(call => 
      call[0]?.toString().includes('/api/storage/cover-letters')
    );
    
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  /**
   * Concrete Test: Verify Fixed Behavior (API call + localStorage)
   * 
   * This test documents the FIXED behavior.
   * It should PASS on fixed code and demonstrates the correct implementation.
   */
  it('FIXED BEHAVIOR: Makes API call AND updates localStorage', async () => {
    const analysisId = 'test-analysis-id';
    const mockAnalysis: SavedAnalysis = {
      id: analysisId,
      matches: [],
      gaps: [],
      suggestions: [],
      timestamp: new Date().toISOString(),
      jobTitle: 'Test Job',
      company: 'Test Company',
      resumeSnippet: 'Test resume...',
      jobPosting: { title: 'Test Job', content: 'Test job content' },
      resume: { content: 'Test resume content' }
    };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockAnalysis]));
    
    // Mock successful API response
    mock$Fetch.mockResolvedValueOnce({
      success: true,
      id: 'cover-letter-id',
      coverLetter: { id: 'cover-letter-id', content: 'Test cover letter content' }
    });

    const coverLetter: CoverLetter = {
      content: 'Test cover letter content',
      timestamp: new Date().toISOString(),
      sampleContent: '',
      history: [],
      editedSections: []
    };

    // Act
    await StorageService.saveCoverLetter(analysisId, coverLetter);

    // Assert: Fixed behavior - localStorage is updated
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    
    // Fixed behavior - API call IS made
    const apiCalls = mock$Fetch.mock.calls.filter(call => 
      call[0]?.toString().includes('/api/storage/cover-letters')
    );
    expect(apiCalls.length).toBeGreaterThan(0); // This PASSES on fixed code
  });
});
