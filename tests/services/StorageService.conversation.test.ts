import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock import.meta for Jest
const mockImportMeta = {
  dev: false
};
Object.defineProperty(global, 'import', {
  value: {
    meta: mockImportMeta
  },
  writable: true
});

import { StorageService } from '../../services/StorageService';
import type { CoverLetterConversation } from '../../types/conversation';
import type { SavedAnalysis } from '../../types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock the global localStorage
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('StorageService Conversation Methods', () => {
  let mockConversation: CoverLetterConversation;
  let mockAnalysis: SavedAnalysis;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Ensure default fetch behavior for tests (server unavailable) so fallback branches are exercised
    (global.fetch as any) = jest.fn(async () => ({ ok: false, status: 503, statusText: 'Service Unavailable' }));
    
    mockConversation = {
      id: 'test-conv-123',
      analysisId: 'test-analysis-456',
      messages: [
        {
          role: 'system',
          content: 'You are a professional cover letter writer...',
          timestamp: '2025-01-01T00:00:00Z'
        },
        {
          role: 'user',
          content: 'Generate a cover letter for this position...',
          timestamp: '2025-01-01T00:01:00Z'
        },
        {
          role: 'assistant',
          content: 'Dear Hiring Manager, I am writing to express...',
          timestamp: '2025-01-01T00:02:00Z'
        }
      ],
      currentContent: 'Dear Hiring Manager, I am writing to express...',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:02:00Z'
    };

    mockAnalysis = {
      id: 'test-analysis-456',
      jobTitle: 'Senior Frontend Developer',
      matches: ['JavaScript', 'Vue.js'],
      maybes: ['React'],
      gaps: ['Python'],
      suggestions: ['Add Python experience'],
      timestamp: '2025-01-01T00:00:00Z',
      jobPosting: { title: 'Senior Frontend Developer', content: 'Job description...' },
      resume: { content: 'Resume content...' }
    };
  });

  describe('saveConversation', () => {
    it('should save new conversation to localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      await StorageService.saveConversation(mockConversation);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('coverLetterConversations');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([mockConversation])
      );
    });

    it('should update existing conversation in localStorage', async () => {
      const existingConversations = [mockConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingConversations));
      
      const updatedConversation = {
        ...mockConversation,
        currentContent: 'Updated cover letter content',
        updatedAt: '2025-01-01T00:03:00Z'
      };
      
      await StorageService.saveConversation(updatedConversation);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([updatedConversation])
      );
    });

    it('should add new conversation to existing list', async () => {
      const existingConversation = { ...mockConversation, id: 'existing-conv' };
      const existingConversations = [existingConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingConversations));
      
      await StorageService.saveConversation(mockConversation);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([existingConversation, mockConversation])
      );
    });
  });

  describe('getConversation', () => {
    it('should retrieve conversation by ID', async () => {
      const conversations = [mockConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));
      
      const result = await StorageService.getConversation('test-conv-123');
      
      expect(result).toEqual(mockConversation);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('coverLetterConversations');
    });

    it('should return null for non-existent conversation', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await StorageService.getConversation('non-existent-id');
      
      expect(result).toBeNull();
    });

    it('should handle empty localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await StorageService.getConversation('test-conv-123');
      
      expect(result).toBeNull();
    });
  });

  describe('getConversations', () => {
    it('should return all conversations', async () => {
      const conversations = [mockConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));
      
      const result = await StorageService.getConversations();
      
      expect(result).toEqual(conversations);
    });

    it('should return empty array when no conversations exist', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await StorageService.getConversations();
      
      expect(result).toEqual([]);
    });

    it('should handle malformed JSON gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      // We fallback to localStorage handling which returns an empty array on parse errors
      const result = await StorageService.getConversations();
      expect(result).toEqual([]);
    });
  });

  describe('deleteConversation', () => {
    it('should remove conversation by ID', async () => {
      const otherConversation = { ...mockConversation, id: 'other-conv' };
      const conversations = [mockConversation, otherConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));
      
      await StorageService.deleteConversation('test-conv-123');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([otherConversation])
      );
    });

    it('should handle deletion of non-existent conversation', async () => {
      const conversations = [mockConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));
      
      await StorageService.deleteConversation('non-existent-id');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify(conversations)
      );
    });

    it('should handle empty conversation list', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      await StorageService.deleteConversation('test-conv-123');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([])
      );
    });
  });

  describe('linkConversationToAnalysis', () => {
    beforeEach(() => {
      // Mock the getAnalyses and other methods
      jest.spyOn(StorageService, 'getAnalyses').mockResolvedValue([mockAnalysis]);
      jest.spyOn(StorageService, 'getConversation').mockResolvedValue(mockConversation);
      // Mock fetchWithBaseUrl to simulate successful server operations
      jest.spyOn(StorageService, 'fetchWithBaseUrl' as any).mockResolvedValue({
        ok: true,
        json: async () => ({})
      });
    });

    it('should link conversation to existing analysis', async () => {
      await StorageService.linkConversationToAnalysis('test-analysis-456', 'test-conv-123');
      
      expect(StorageService.getAnalyses).toHaveBeenCalled();
      expect((StorageService as any).fetchWithBaseUrl).toHaveBeenCalledWith('/api/storage', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify([{ ...mockAnalysis, conversationId: 'test-conv-123' }])
      }));
    });

    it('should handle non-existent analysis gracefully', async () => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
      jest.spyOn(StorageService, 'getAnalyses').mockResolvedValue([]);
      const spyGetConversation = jest.spyOn(StorageService, 'getConversation');
      
      await StorageService.linkConversationToAnalysis('non-existent-analysis', 'test-conv-123');
      
      expect(StorageService.getAnalyses).toHaveBeenCalled();
      expect(spyGetConversation).not.toHaveBeenCalled();
    });

    it('should handle non-existent conversation', async () => {
      const mockAnalysis: SavedAnalysis = {
        id: 'test-analysis-456',
        jobTitle: 'Software Engineer',
        company: 'Test Company',
        timestamp: new Date().toISOString(),
        analysisResult: {
          matches: [],
          maybes: [],
          gaps: [],
          suggestions: []
        },
        jobPosting: {
          title: 'Software Engineer',
          company: 'Test Company',
          description: 'Test description',
          requirements: []
        },
        resume: {
          name: 'Test Resume',
          content: 'Test content'
        },
        matches: [],
        maybes: [],
        gaps: [],
        suggestions: []
      };
      
      jest.spyOn(StorageService, 'getAnalyses').mockResolvedValue([mockAnalysis]);
      
      // Mock the private fetchWithBaseUrl method
      const fetchSpy = jest.spyOn(StorageService as never, 'fetchWithBaseUrl').mockResolvedValue({
        ok: true,
        json: async () => ({}),
        status: 200,
        statusText: 'OK'
      } as Response);
      
      await StorageService.linkConversationToAnalysis('test-analysis-456', 'non-existent-conv');
      
      // Should still attempt to save the analysis with the conversation ID
      expect(fetchSpy).toHaveBeenCalledWith('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          ...mockAnalysis,
          conversationId: 'non-existent-conv'
        }])
      });
    });
  });

  describe('error handling', () => {
    it('should handle localStorage setItem errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw when localStorage fails, just log the error
      await expect(StorageService.saveConversation(mockConversation)).resolves.toBeUndefined();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle localStorage getItem errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      // Should return empty array when localStorage fails
      const result = await StorageService.getConversations();
      expect(result).toEqual([]);
    });
  });

  describe('data integrity', () => {
    beforeEach(() => {
      // Reset mocks specifically for data integrity tests
      jest.clearAllMocks();
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockClear();
      // Remove the error-throwing implementation
      mockLocalStorage.setItem.mockImplementation(() => {});
    });

    it('should preserve conversation message order', async () => {
      const conversationWithManyMessages = {
        ...mockConversation,
        messages: [
          { role: 'system' as const, content: 'System message', timestamp: '2025-01-01T00:00:00Z' },
          { role: 'user' as const, content: 'User message 1', timestamp: '2025-01-01T00:01:00Z' },
          { role: 'assistant' as const, content: 'Assistant response 1', timestamp: '2025-01-01T00:02:00Z' },
          { role: 'user' as const, content: 'User message 2', timestamp: '2025-01-01T00:03:00Z' },
          { role: 'assistant' as const, content: 'Assistant response 2', timestamp: '2025-01-01T00:04:00Z' }
        ]
      };
      
      mockLocalStorage.getItem.mockReturnValue(null);
      await StorageService.saveConversation(conversationWithManyMessages);
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([conversationWithManyMessages]));
      const retrieved = await StorageService.getConversation(conversationWithManyMessages.id);
      
      expect(retrieved?.messages).toHaveLength(5);
      expect(retrieved?.messages[0].content).toBe('System message');
      expect(retrieved?.messages[4].content).toBe('Assistant response 2');
    });

    it('should preserve metadata in messages', async () => {
      const conversationWithMetadata = {
        ...mockConversation,
        messages: [
          ...mockConversation.messages,
          {
            role: 'user' as const,
            content: 'Instruction with metadata',
            timestamp: '2025-01-01T00:03:00Z',
            metadata: {
              instructions: 'Make it more formal',
              referenceContent: 'Previous version content'
            }
          }
        ]
      };
      
      mockLocalStorage.getItem.mockReturnValue(null);
      await StorageService.saveConversation(conversationWithMetadata);
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([conversationWithMetadata]));
      const retrieved = await StorageService.getConversation(conversationWithMetadata.id);
      
      const messageWithMetadata = retrieved?.messages.find(m => m.metadata);
      expect(messageWithMetadata?.metadata?.instructions).toBe('Make it more formal');
      expect(messageWithMetadata?.metadata?.referenceContent).toBe('Previous version content');
    });
  });
});
