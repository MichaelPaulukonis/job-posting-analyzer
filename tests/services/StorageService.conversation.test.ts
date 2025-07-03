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
      
      await storageService.saveConversation(mockConversation);
      
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
      
      await storageService.saveConversation(updatedConversation);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([updatedConversation])
      );
    });

    it('should add new conversation to existing list', async () => {
      const existingConversation = { ...mockConversation, id: 'existing-conv' };
      const existingConversations = [existingConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingConversations));
      
      await storageService.saveConversation(mockConversation);
      
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
      
      const result = await storageService.getConversation('test-conv-123');
      
      expect(result).toEqual(mockConversation);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('coverLetterConversations');
    });

    it('should return null for non-existent conversation', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await storageService.getConversation('non-existent-id');
      
      expect(result).toBeNull();
    });

    it('should handle empty localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await storageService.getConversation('test-conv-123');
      
      expect(result).toBeNull();
    });
  });

  describe('getConversations', () => {
    it('should return all conversations', async () => {
      const conversations = [mockConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));
      
      const result = await storageService.getConversations();
      
      expect(result).toEqual(conversations);
    });

    it('should return empty array when no conversations exist', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await storageService.getConversations();
      
      expect(result).toEqual([]);
    });

    it('should handle malformed JSON gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      // Should throw or return empty array depending on implementation
      await expect(storageService.getConversations()).rejects.toThrow();
    });
  });

  describe('deleteConversation', () => {
    it('should remove conversation by ID', async () => {
      const otherConversation = { ...mockConversation, id: 'other-conv' };
      const conversations = [mockConversation, otherConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));
      
      await storageService.deleteConversation('test-conv-123');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([otherConversation])
      );
    });

    it('should handle deletion of non-existent conversation', async () => {
      const conversations = [mockConversation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));
      
      await storageService.deleteConversation('non-existent-id');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify(conversations)
      );
    });

    it('should handle empty conversation list', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      await storageService.deleteConversation('test-conv-123');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coverLetterConversations',
        JSON.stringify([])
      );
    });
  });

  describe('linkConversationToAnalysis', () => {
    beforeEach(() => {
      // Mock the getSavedAnalyses and saveAnalysis methods
      jest.spyOn(storageService, 'getSavedAnalyses').mockResolvedValue([mockAnalysis]);
      jest.spyOn(storageService, 'saveAnalysis').mockResolvedValue();
      jest.spyOn(storageService, 'getConversation').mockResolvedValue(mockConversation);
    });

    it('should link conversation to existing analysis', async () => {
      await storageService.linkConversationToAnalysis('test-analysis-456', 'test-conv-123');
      
      expect(storageService.getSavedAnalyses).toHaveBeenCalled();
      expect(storageService.getConversation).toHaveBeenCalledWith('test-conv-123');
      expect(storageService.saveAnalysis).toHaveBeenCalledWith({
        ...mockAnalysis,
        conversation: mockConversation
      });
    });

    it('should handle non-existent analysis gracefully', async () => {
      jest.spyOn(storageService, 'getSavedAnalyses').mockResolvedValue([]);
      
      await storageService.linkConversationToAnalysis('non-existent-analysis', 'test-conv-123');
      
      expect(storageService.getSavedAnalyses).toHaveBeenCalled();
      expect(storageService.getConversation).not.toHaveBeenCalled();
      expect(storageService.saveAnalysis).not.toHaveBeenCalled();
    });

    it('should handle non-existent conversation', async () => {
      jest.spyOn(storageService, 'getConversation').mockResolvedValue(null);
      
      await storageService.linkConversationToAnalysis('test-analysis-456', 'non-existent-conv');
      
      expect(storageService.saveAnalysis).toHaveBeenCalledWith({
        ...mockAnalysis,
        conversation: null
      });
    });
  });

  describe('error handling', () => {
    it('should handle localStorage setItem errors', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await expect(storageService.saveConversation(mockConversation)).rejects.toThrow('Storage quota exceeded');
    });

    it('should handle localStorage getItem errors', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      await expect(storageService.getConversations()).rejects.toThrow('Storage access denied');
    });
  });

  describe('data integrity', () => {
    it('should preserve conversation message order', async () => {
      const conversationWithManyMessages = {
        ...mockConversation,
        messages: [
          { role: 'system', content: 'System message', timestamp: '2025-01-01T00:00:00Z' },
          { role: 'user', content: 'User message 1', timestamp: '2025-01-01T00:01:00Z' },
          { role: 'assistant', content: 'Assistant response 1', timestamp: '2025-01-01T00:02:00Z' },
          { role: 'user', content: 'User message 2', timestamp: '2025-01-01T00:03:00Z' },
          { role: 'assistant', content: 'Assistant response 2', timestamp: '2025-01-01T00:04:00Z' }
        ]
      };
      
      mockLocalStorage.getItem.mockReturnValue(null);
      await storageService.saveConversation(conversationWithManyMessages);
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([conversationWithManyMessages]));
      const retrieved = await storageService.getConversation(conversationWithManyMessages.id);
      
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
            role: 'user',
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
      await storageService.saveConversation(conversationWithMetadata);
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([conversationWithMetadata]));
      const retrieved = await storageService.getConversation(conversationWithMetadata.id);
      
      const messageWithMetadata = retrieved?.messages.find(m => m.metadata);
      expect(messageWithMetadata?.metadata?.instructions).toBe('Make it more formal');
      expect(messageWithMetadata?.metadata?.referenceContent).toBe('Previous version content');
    });
  });
});
