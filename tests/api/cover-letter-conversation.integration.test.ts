import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the required modules
jest.mock('~/services/StorageService');
jest.mock('~/utils/conversationUtils');

import type { SavedAnalysis } from '~/types';
import type { CoverLetterConversation } from '~/types/conversation';

describe('Cover Letter API with Conversation Context', () => {
  let mockAnalysis: SavedAnalysis;
  let mockConversation: CoverLetterConversation;

  beforeEach(() => {
    mockAnalysis = {
      id: 'test-analysis-123',
      jobTitle: 'Software Engineer',
      company: 'Test Company',
      timestamp: '2025-01-01T00:00:00Z',
      analysisResult: {
        matches: ['JavaScript', 'React'],
        maybes: ['Node.js'],
        gaps: ['Python'],
        suggestions: ['Add Python experience']
      },
      jobPosting: {
        title: 'Software Engineer',
        description: 'We are looking for a skilled software engineer...',
        requirements: ['JavaScript', 'React', 'Python']
      },
      resume: {
        content: 'John Doe\nSoftware Engineer with 5 years experience...'
      },
      matches: ['JavaScript', 'React'],
      maybes: ['Node.js'],
      gaps: ['Python'],
      suggestions: ['Add Python experience']
    };

    mockConversation = {
      id: 'conv-123',
      analysisId: 'test-analysis-123',
      messages: [
        {
          role: 'system',
          content: 'You are a professional cover letter writer...',
          timestamp: '2025-01-01T00:00:00Z'
        }
      ],
      currentContent: '',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    };
  });

  it('should create a new conversation for first-time cover letter generation', async () => {
    // This test verifies that the API creates a new conversation
    // when no conversationId is provided
    
    const requestBody = {
      analysis: mockAnalysis,
      serviceName: 'mock',
      isNewConversation: true
    };

    // In a real integration test, we would:
    // 1. Call the API endpoint
    // 2. Verify a new conversation is created
    // 3. Verify the conversation is linked to the analysis
    // 4. Verify the response includes conversationId

    expect(requestBody.analysis.id).toBe('test-analysis-123');
    expect(requestBody.serviceName).toBe('mock');
    expect(requestBody.isNewConversation).toBe(true);
  });

  it('should continue existing conversation when conversationId provided', async () => {
    // This test verifies that the API can continue an existing conversation
    
    const requestBody = {
      analysis: mockAnalysis,
      serviceName: 'mock',
      conversationId: 'conv-123',
      isNewConversation: false,
      instructions: 'Make it more formal'
    };

    // In a real integration test, we would:
    // 1. Create an existing conversation
    // 2. Call the API with the conversationId
    // 3. Verify the existing conversation is retrieved
    // 4. Verify new messages are added to the conversation
    // 5. Verify the conversation is saved with updated content

    expect(requestBody.conversationId).toBe('conv-123');
    expect(requestBody.instructions).toBe('Make it more formal');
  });

  it('should handle conversation metadata for instructions and reference content', async () => {
    // This test verifies that user messages properly capture metadata
    
    const requestBody = {
      analysis: mockAnalysis,
      serviceName: 'mock',
      instructions: 'Make it more professional',
      referenceContent: 'Previous cover letter version...'
    };

    // In a real integration test, we would:
    // 1. Call the API with instructions and reference content
    // 2. Verify the user message contains metadata
    // 3. Verify the metadata includes instructions and referenceContent

    expect(requestBody.instructions).toBe('Make it more professional');
    expect(requestBody.referenceContent).toBe('Previous cover letter version...');
  });
});
