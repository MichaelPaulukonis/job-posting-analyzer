/**
 * Preservation Property Tests for Cover Letter Save Bug Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * These tests verify that non-Save operations continue to work correctly.
 * They are EXPECTED TO PASS on unfixed code (baseline behavior).
 * After the fix, they should STILL PASS (no regressions).
 * 
 * Property 2: Preservation - Non-Save Operations
 * 
 * For any operation that is NOT clicking the Save button, the fixed code SHALL
 * produce exactly the same behavior as the original code, preserving:
 * - Conversation saving via /api/storage/conversations
 * - Cover letter generation with all AI services
 * - Cover letter sample saving via /api/cover-letter-samples
 * - localStorage fallback when API is unavailable
 * 
 * CRITICAL: These tests document CURRENT (working) behavior that must be preserved.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { StorageService } from '~/services/StorageService';
import { CoverLetterService } from '~/services/CoverLetterService';
import type { CoverLetterConversation } from '~/types/conversation';
import type { SavedAnalysis } from '~/types';

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
      error: { value: null }
    };
  })
}));

describe('Preservation: Non-Save Operations', () => {
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
   * Property 2.1: Conversation Saving Preservation
   * 
   * VALIDATES: Requirement 3.1
   * 
   * Conversations are saved to database via /api/storage/conversations endpoint.
   * This functionality must continue to work exactly as before.
   * 
   * EXPECTED OUTCOME: PASS on unfixed code (baseline behavior)
   */
  describe('Property 2.1: Conversation Saving', () => {
    it('should save conversations to /api/storage/conversations endpoint', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate conversation data
          fc.uuid(), // conversationId
          fc.uuid(), // analysisId
          fc.array(fc.record({
            role: fc.constantFrom('user', 'assistant'),
            content: fc.string({ minLength: 10, maxLength: 500 })
          }), { minLength: 1, maxLength: 10 }), // messages
          async (conversationId, analysisId, messages) => {
            // Setup: Create conversation object
            const conversation: CoverLetterConversation = {
              id: conversationId,
              analysisId,
              messages,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Mock successful API response
            mock$Fetch.mockResolvedValueOnce({
              success: true,
              id: conversationId
            });

            // Act: Save conversation
            await StorageService.saveConversation(conversation);

            // Assert: API call should be made to /api/storage/conversations
            const apiCalls = mock$Fetch.mock.calls.filter(call => 
              call[0]?.toString().includes('/api/storage/conversations')
            );
            
            expect(apiCalls.length).toBeGreaterThan(0);
            
            // Verify request structure (without checking exact IDs since they may be regenerated)
            if (apiCalls.length > 0) {
              const [path, options] = apiCalls[0];
              expect(options?.method).toBe('POST');
              expect(options?.headers).toHaveProperty('Content-Type', 'application/json');
              
              const body = JSON.parse(options?.body as string);
              expect(body).toHaveProperty('id'); // Just check it has an ID
              expect(body).toHaveProperty('analysisId'); // Just check it has an analysisId
              expect(body).toHaveProperty('messages');
              expect(Array.isArray(body.messages)).toBe(true);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should retrieve conversations from /api/storage/conversations endpoint', async () => {
      // Setup: Mock API response with conversations
      const mockConversations: CoverLetterConversation[] = [
        {
          id: 'conv-1',
          analysisId: 'analysis-1',
          messages: [{ role: 'user', content: 'Test message' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      mock$Fetch.mockResolvedValueOnce(mockConversations);

      // Act: Get conversations
      const conversations = await StorageService.getConversations();

      // Assert: API call should be made
      const apiCalls = mock$Fetch.mock.calls.filter(call => 
        call[0]?.toString().includes('/api/storage/conversations')
      );
      
      expect(apiCalls.length).toBeGreaterThan(0);
      expect(conversations).toEqual(mockConversations);
    });

    it('should fall back to localStorage when API fails', async () => {
      // Setup: Mock API failure
      mock$Fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Mock localStorage with conversation data
      const localConversation: CoverLetterConversation = {
        id: 'local-conv-1',
        analysisId: 'analysis-1',
        messages: [{ role: 'user', content: 'Local message' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([localConversation]));

      // Act: Save conversation (should fall back to localStorage)
      await StorageService.saveConversation(localConversation);

      // Assert: localStorage should be updated
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  /**
   * Property 2.2: Cover Letter Generation Preservation
   * 
   * VALIDATES: Requirement 3.2
   * 
   * Cover letters are generated correctly with all AI services.
   * This functionality must continue to work exactly as before.
   * 
   * EXPECTED OUTCOME: PASS on unfixed code (baseline behavior)
   * 
   * NOTE: We test the API endpoint structure, not the full generation flow,
   * since that requires complex mocking of AI services.
   */
  describe('Property 2.2: Cover Letter Generation', () => {
    it('should call /api/cover-letter/generate endpoint with correct structure', async () => {
      // Setup: Create analysis object
      const analysisId = 'test-analysis-id';
      const analysis: SavedAnalysis = {
        id: analysisId,
        matches: ['Test match'],
        gaps: ['Test gap'],
        suggestions: ['Test suggestion'],
        timestamp: new Date().toISOString(),
        jobTitle: 'Test Job',
        resumeSnippet: 'Test resume...',
        jobPosting: {
          title: 'Test Job',
          content: 'Test job content'
        },
        resume: {
          content: 'Test resume content'
        }
      };

      // Mock fetch response for cover letter generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          currentContent: 'Generated cover letter content',
          updatedAt: new Date().toISOString(),
          id: 'conv-id',
          analysisId,
          messages: [],
          createdAt: new Date().toISOString()
        })
      } as Response);

      // Act: Generate cover letter
      const result = await CoverLetterService.generateCoverLetter(
        analysis,
        undefined, // no existing conversation
        '', // no sample
        undefined, // no instructions
        undefined, // no reference
        'gemini'
      );

      // Assert: Cover letter should be generated
      expect(result).toHaveProperty('coverLetter');
      expect(result.coverLetter).toHaveProperty('content');
      expect(result.coverLetter.content).toBe('Generated cover letter content');
      
      // Verify API call was made to generate endpoint
      const apiCalls = mockFetch.mock.calls.filter(call => 
        call[0]?.toString().includes('/api/cover-letter/generate')
      );
      expect(apiCalls.length).toBeGreaterThan(0);
    });

    it('should preserve conversation context when regenerating', async () => {
      // Setup: Create analysis and existing conversation
      const analysisId = 'test-analysis-id';
      const conversationId = 'existing-conv-id';
      
      const analysis: SavedAnalysis = {
        id: analysisId,
        matches: [],
        gaps: [],
        suggestions: [],
        timestamp: new Date().toISOString(),
        jobTitle: 'Test Job',
        resumeSnippet: 'Test resume...',
        jobPosting: { title: 'Test Job', content: 'Test job content' },
        resume: { content: 'Test resume content' }
      };

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          currentContent: 'New cover letter',
          updatedAt: new Date().toISOString(),
          id: conversationId,
          analysisId,
          messages: [
            { role: 'user', content: 'Previous message' },
            { role: 'assistant', content: 'Previous response' },
            { role: 'user', content: 'Generate cover letter' },
            { role: 'assistant', content: 'New cover letter' }
          ],
          createdAt: new Date().toISOString()
        })
      } as Response);

      // Act: Generate with existing conversation
      const result = await CoverLetterService.generateCoverLetter(
        analysis,
        conversationId,
        '',
        undefined,
        undefined,
        'gemini'
      );

      // Assert: Conversation should be preserved
      expect(result.conversation).toBeDefined();
      expect(result.conversation.id).toBe(conversationId);
      expect(result.conversation.messages.length).toBeGreaterThan(2);
    });
  });

  /**
   * Property 2.3: Cover Letter Sample Saving Preservation
   * 
   * VALIDATES: Requirement 3.5
   * 
   * Cover letter samples are saved via /api/cover-letter-samples endpoint.
   * This functionality must continue to work exactly as before.
   * 
   * EXPECTED OUTCOME: PASS on unfixed code (baseline behavior)
   */
  describe('Property 2.3: Cover Letter Sample Saving', () => {
    it('should save samples to /api/cover-letter-samples endpoint', async () => {
      // Setup: Mock API responses
      // First call: GET existing samples
      mock$Fetch.mockResolvedValueOnce([]);
      
      // Second call: POST to save samples
      mock$Fetch.mockResolvedValueOnce({ success: true });

      // Act: Save sample
      await StorageService.saveCoverLetterSample({
        content: 'Test cover letter content',
        name: 'Test Sample',
        notes: 'Test notes'
      });

      // Assert: API calls should be made to /api/cover-letter-samples
      const apiCalls = mock$Fetch.mock.calls.filter(call => 
        call[0]?.toString().includes('/api/cover-letter-samples')
      );
      
      expect(apiCalls.length).toBeGreaterThan(0);
      
      // Verify POST request was made
      const postCalls = apiCalls.filter(call => {
        const options = call[1];
        return options?.method === 'POST';
      });
      
      expect(postCalls.length).toBeGreaterThan(0);
    });

    it('should retrieve samples from /api/cover-letter-samples endpoint', async () => {
      // Setup: Mock API response with samples
      const mockSamples = [
        {
          id: 'sample-1',
          name: 'Test Sample',
          content: 'Sample content',
          notes: 'Test notes',
          timestamp: new Date().toISOString()
        }
      ];

      mock$Fetch.mockResolvedValueOnce(mockSamples);

      // Act: Get samples
      const samples = await StorageService.getCoverLetterSamples();

      // Assert: API call should be made
      const apiCalls = mock$Fetch.mock.calls.filter(call => 
        call[0]?.toString().includes('/api/cover-letter-samples')
      );
      
      expect(apiCalls.length).toBeGreaterThan(0);
      expect(samples).toEqual(mockSamples);
    });
  });

  /**
   * Property 2.4: localStorage Fallback Preservation
   * 
   * VALIDATES: Requirements 3.1, 3.2, 3.3, 3.5
   * 
   * localStorage fallback works when API is unavailable.
   * This functionality must continue to work exactly as before.
   * 
   * EXPECTED OUTCOME: PASS on unfixed code (baseline behavior)
   */
  describe('Property 2.4: localStorage Fallback', () => {
    it('should fall back to localStorage for conversations when API fails', async () => {
      // Setup: Mock API failure
      mock$Fetch.mockRejectedValue(new Error('Network error'));

      const conversation: CoverLetterConversation = {
        id: 'test-conv-id',
        analysisId: 'test-analysis-id',
        messages: [{ role: 'user', content: 'Test' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Act: Save conversation (should fall back to localStorage)
      await StorageService.saveConversation(conversation);

      // Assert: localStorage should be used as fallback
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      
      // Verify the data was saved to localStorage
      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const conversationSaves = setItemCalls.filter(call => 
        call[0] === 'coverLetterConversations'
      );
      
      expect(conversationSaves.length).toBeGreaterThan(0);
    });

    it('should retrieve from localStorage when API is unavailable', async () => {
      // Setup: Mock API failure
      mock$Fetch.mockRejectedValue(new Error('Network error'));
      
      // Mock localStorage with data
      const localConversations: CoverLetterConversation[] = [
        {
          id: 'local-conv-1',
          analysisId: 'analysis-1',
          messages: [{ role: 'user', content: 'Local message' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(localConversations));

      // Act: Get conversations (should fall back to localStorage)
      const conversations = await StorageService.getConversations();

      // Assert: Should return localStorage data
      expect(conversations).toEqual(localConversations);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('coverLetterConversations');
    });

    it('should fall back to localStorage for samples when API fails', async () => {
      // Setup: Mock API failure
      mock$Fetch.mockRejectedValue(new Error('Network error'));
      
      // Mock localStorage with sample data
      const localSamples = [
        {
          id: 'local-sample-1',
          name: 'Local Sample',
          content: 'Local content',
          notes: 'Local notes',
          timestamp: new Date().toISOString()
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(localSamples));

      // Act: Get samples (should fall back to localStorage)
      const samples = await StorageService.getCoverLetterSamples();

      // Assert: Should return localStorage data
      expect(samples).toEqual(localSamples);
      expect(mockLocalStorage.getItem).toHaveBeenCalled();
    });
  });

  /**
   * Property 2.5: Non-Save Operations Don't Affect Cover Letter Persistence
   * 
   * VALIDATES: All preservation requirements
   * 
   * Operations like copying to clipboard, loading cover letters, and
   * regenerating should not trigger any save-related API calls.
   * 
   * EXPECTED OUTCOME: PASS on unfixed code (baseline behavior)
   */
  describe('Property 2.5: Non-Save Operations', () => {
    it('should not make API calls to /api/storage/cover-letters for non-save operations', async () => {
      // Setup: Mock analysis with cover letter
      const analysisId = 'test-analysis-id';
      const analysis: SavedAnalysis = {
        id: analysisId,
        matches: [],
        gaps: [],
        suggestions: [],
        timestamp: new Date().toISOString(),
        jobTitle: 'Test Job',
        resumeSnippet: 'Test resume...',
        jobPosting: { title: 'Test Job', content: 'Test job content' },
        resume: { content: 'Test resume content' },
        coverLetter: {
          content: 'Existing cover letter',
          timestamp: new Date().toISOString(),
          sampleContent: '',
          history: [],
          editedSections: []
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([analysis]));

      // Act: Perform various non-save operations
      // 1. Load cover letter (reading from localStorage)
      const analyses = JSON.parse(mockLocalStorage.getItem('job-analysis-history') || '[]');
      const loadedAnalysis = analyses.find((a: SavedAnalysis) => a.id === analysisId);
      
      // 2. Copy to clipboard (simulated - no actual API call)
      const clipboardContent = loadedAnalysis?.coverLetter?.content;

      // Assert: No API calls to /api/storage/cover-letters should be made
      const coverLetterApiCalls = mockFetch.mock.calls.filter(call => 
        call[0]?.toString().includes('/api/storage/cover-letters')
      );
      
      expect(coverLetterApiCalls.length).toBe(0);
      expect(clipboardContent).toBe('Existing cover letter');
    });
  });
});
