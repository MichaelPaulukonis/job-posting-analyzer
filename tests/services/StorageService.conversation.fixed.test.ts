// Mock import.meta for Jest
(global as any).importMeta = {
  dev: process.env.NODE_ENV === 'development'
};

// Mock window for node environment
Object.defineProperty(global, 'window', {
  value: {
    location: {
      origin: 'http://localhost:3000'
    }
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

// Mock fetch for server requests
global.fetch = jest.fn();

describe('StorageService Conversation Methods', () => {
  let mockConversation: CoverLetterConversation;
  let mockAnalysis: SavedAnalysis;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
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
          content: 'Please write a cover letter for this job...',
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
      // Mock localStorage returns null (no existing conversations)
      mockLocalStorage.getItem.mockReturnValue(null);
      
      await StorageService.saveConversation(mockConversation);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('coverLetterConversations');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([mockConversation])
      );
    });

    it('should update existing conversation in localStorage', async () => {
      // Mock existing conversation
      const existingConversations = [mockConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingConversations));
      
      const updatedConversation = {
        ...mockConversation,
        currentContent: 'Updated content...',
        updatedAt: '2025-01-01T00:03:00Z'
      };
      
      await StorageService.saveConversation(updatedConversation);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([updatedConversation])
      );
    });

    it('should add new conversation to existing list', async () => {
      const existingConversations = [{ ...mockConversation, id: 'different-id' }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingConversations));
      
      await StorageService.saveConversation(mockConversation);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([...existingConversations, mockConversation])
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
      
      // Should throw or return empty array depending on implementation
      await expect(StorageService.getConversations()).rejects.toThrow();
    });
  });

  describe('deleteConversation', () => {
    it('should remove conversation by ID', async () => {
      const conversations = [mockConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));
      
      await StorageService.deleteConversation('test-conv-123');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([])
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
      // Mock the getAnalyses method
      jest.spyOn(StorageService, 'getAnalyses').mockResolvedValue([mockAnalysis]);
      jest.spyOn(StorageService, 'getConversation').mockResolvedValue(mockConversation);
    });

    it('should link conversation to existing analysis', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await StorageService.linkConversationToAnalysis('test-analysis-456', 'test-conv-123');
      
      expect(StorageService.getAnalyses).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/storage',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ ...mockAnalysis, conversationId: 'test-conv-123' }])
        })
      );
    });

    it('should handle non-existent analysis gracefully', async () => {
      jest.spyOn(StorageService, 'getAnalyses').mockResolvedValue([]);
      
      await expect(StorageService.linkConversationToAnalysis('non-existent-analysis', 'test-conv-123')).resolves.not.toThrow();
    });

    it('should handle non-existent conversation', async () => {
      jest.spyOn(StorageService, 'getConversation').mockResolvedValue(null);
      
      await expect(StorageService.linkConversationToAnalysis('test-analysis-456', 'non-existent-conv')).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle localStorage setItem errors', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await expect(StorageService.saveConversation(mockConversation)).rejects.toThrow('Storage quota exceeded');
    });

    it('should handle localStorage getItem errors', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      await expect(StorageService.getConversations()).rejects.toThrow('Storage access denied');
    });
  });

  describe('data integrity', () => {
    it('should preserve conversation message order', async () => {
      const conversationWithManyMessages = {
        ...mockConversation,
        messages: [
          { role: 'system' as const, content: 'System message', timestamp: '2025-01-01T00:00:00Z' },
          { role: 'user' as const, content: 'User message 1', timestamp: '2025-01-01T00:01:00Z' },
          { role: 'assistant' as const, content: 'Assistant message 1', timestamp: '2025-01-01T00:02:00Z' },
          { role: 'user' as const, content: 'User message 2', timestamp: '2025-01-01T00:03:00Z' },
          { role: 'assistant' as const, content: 'Assistant message 2', timestamp: '2025-01-01T00:04:00Z' }
        ]
      };
      
      mockLocalStorage.getItem.mockReturnValue(null);
      await StorageService.saveConversation(conversationWithManyMessages);
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([conversationWithManyMessages]));
      const retrieved = await StorageService.getConversation(conversationWithManyMessages.id);
      
      expect(retrieved?.messages).toEqual(conversationWithManyMessages.messages);
    });

    it('should preserve metadata in messages', async () => {
      const conversationWithMetadata = {
        ...mockConversation,
        messages: [
          {
            role: 'system' as const,
            content: 'System message',
            timestamp: '2025-01-01T00:00:00Z',
            metadata: {
              instructions: 'Be professional and concise',
              sampleLetter: 'Sample letter content...',
              referenceContent: 'Reference content...'
            }
          }
        ]
      };
      
      mockLocalStorage.getItem.mockReturnValue(null);
      await StorageService.saveConversation(conversationWithMetadata);
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([conversationWithMetadata]));
      const retrieved = await StorageService.getConversation(conversationWithMetadata.id);
      
      expect(retrieved?.messages[0].metadata).toEqual(conversationWithMetadata.messages[0].metadata);
    });
  });
});
