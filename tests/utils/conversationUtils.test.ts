import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  createConversationContext, 
  addToConversation, 
  formatConversationForAI,
  estimateTokenCount,
  isConversationTooLong,
  createConversationSummary 
} from '../../utils/conversationUtils';
import type { SavedAnalysis } from '../../types';
import type { ConversationContext } from '../../types/conversation';

describe('conversationUtils', () => {
  let mockAnalysis: SavedAnalysis;

  beforeEach(() => {
    mockAnalysis = {
      id: 'test-analysis-123',
      jobTitle: 'Senior Frontend Developer',
      matches: ['JavaScript', 'Vue.js', 'TypeScript', 'CSS'],
      maybes: ['React experience', 'Node.js background'],
      gaps: ['Python', 'AWS certification', 'Docker'],
      suggestions: ['Add Python experience', 'Highlight cloud platform knowledge', 'Mention containerization'],
      timestamp: '2025-01-01T00:00:00Z',
      jobPosting: { 
        title: 'Senior Frontend Developer', 
        content: 'We are looking for a senior frontend developer with JavaScript, Vue.js, and TypeScript experience. Python and AWS knowledge preferred.' 
      },
      resume: { 
        content: 'Experienced frontend developer with 5 years of JavaScript and Vue.js development. Strong TypeScript skills and CSS expertise.' 
      }
    };
  });

  describe('createConversationContext', () => {
    it('should create initial conversation context with system and analysis messages', () => {
      const context = createConversationContext(mockAnalysis);
      
      expect(context.systemMessage.role).toBe('system');
      expect(context.systemMessage.content).toContain('professional cover letter writer');
      expect(context.systemMessage.timestamp).toBeDefined();
      
      expect(context.analysisContext.role).toBe('user');
      expect(context.analysisContext.content).toContain('Senior Frontend Developer');
      expect(context.analysisContext.content).toContain('JavaScript');
      expect(context.analysisContext.content).toContain('Python');
      expect(context.analysisContext.timestamp).toBeDefined();
      
      expect(context.conversationHistory).toHaveLength(0);
    });

    it('should include sample letter when provided', () => {
      const sampleLetter = 'Dear Hiring Manager, I am excited to apply for this position...';
      const context = createConversationContext(mockAnalysis, sampleLetter);
      
      expect(context.analysisContext.content).toContain(sampleLetter);
      expect(context.analysisContext.content).toContain('MY SAMPLE COVER LETTER');
    });

    it('should not include sample letter section when not provided', () => {
      const context = createConversationContext(mockAnalysis);
      
      expect(context.analysisContext.content).not.toContain('MY SAMPLE COVER LETTER');
    });
  });

  describe('addToConversation', () => {
    let context: ConversationContext;

    beforeEach(() => {
      context = createConversationContext(mockAnalysis);
    });

    it('should add user instruction and assistant response to conversation history', () => {
      const instruction = 'Make the letter more formal and remove any casual language';
      const response = 'Dear Hiring Manager, I am writing to express my interest...';
      
      const updated = addToConversation(context, instruction, response);
      
      expect(updated.conversationHistory).toHaveLength(2);
      
      const userMessage = updated.conversationHistory[0];
      expect(userMessage.role).toBe('user');
      expect(userMessage.content).toBe(instruction);
      expect(userMessage.timestamp).toBeDefined();
      
      const assistantMessage = updated.conversationHistory[1];
      expect(assistantMessage.role).toBe('assistant');
      expect(assistantMessage.content).toBe(response);
      expect(assistantMessage.timestamp).toBeDefined();
    });

    it('should preserve existing conversation history when adding new messages', () => {
      // Add first interaction
      const updated1 = addToConversation(context, 'First instruction', 'First response');
      
      // Add second interaction
      const updated2 = addToConversation(updated1, 'Second instruction', 'Second response');
      
      expect(updated2.conversationHistory).toHaveLength(4);
      expect(updated2.conversationHistory[0].content).toBe('First instruction');
      expect(updated2.conversationHistory[1].content).toBe('First response');
      expect(updated2.conversationHistory[2].content).toBe('Second instruction');
      expect(updated2.conversationHistory[3].content).toBe('Second response');
    });

    it('should not mutate the original context object', () => {
      const originalHistoryLength = context.conversationHistory.length;
      
      addToConversation(context, 'Test instruction', 'Test response');
      
      expect(context.conversationHistory).toHaveLength(originalHistoryLength);
    });
  });

  describe('formatConversationForAI', () => {
    let contextWithHistory: ConversationContext;

    beforeEach(() => {
      const baseContext = createConversationContext(mockAnalysis);
      contextWithHistory = addToConversation(
        baseContext, 
        'Remove flowery language', 
        'Updated cover letter without flowery language'
      );
    });

    it('should format conversation without new instructions', () => {
      const formatted = formatConversationForAI(contextWithHistory);
      
      expect(formatted.systemInstruction).toContain('professional cover letter writer');
      expect(formatted.messages).toHaveLength(3); // analysis + user + assistant
      
      expect(formatted.messages[0].role).toBe('user'); // analysis context
      expect(formatted.messages[1].role).toBe('user'); // user instruction
      expect(formatted.messages[2].role).toBe('assistant'); // AI response
    });

    it('should add new instructions to message array', () => {
      const newInstruction = 'Make it more technical and include specific metrics';
      const formatted = formatConversationForAI(contextWithHistory, newInstruction);
      
      expect(formatted.messages).toHaveLength(4);
      expect(formatted.messages[3].role).toBe('user');
      expect(formatted.messages[3].content).toBe(newInstruction);
    });

    it('should include reference content when provided', () => {
      const referenceContent = 'This is the current version that needs editing...';
      const newInstruction = 'Update this version';
      
      const formatted = formatConversationForAI(
        contextWithHistory, 
        newInstruction, 
        referenceContent
      );
      
      const lastMessage = formatted.messages[formatted.messages.length - 1];
      expect(lastMessage.content).toContain(newInstruction);
      expect(lastMessage.content).toContain('REFERENCE VERSION');
      expect(lastMessage.content).toContain(referenceContent);
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate token count for basic conversation', () => {
      const context = createConversationContext(mockAnalysis);
      const tokenCount = estimateTokenCount(context);
      
      expect(tokenCount).toBeGreaterThan(0);
      expect(typeof tokenCount).toBe('number');
    });

    it('should increase token count as conversation grows', () => {
      const context = createConversationContext(mockAnalysis);
      const initialCount = estimateTokenCount(context);
      
      const updatedContext = addToConversation(
        context, 
        'This is a longer instruction that should increase the token count significantly',
        'This is a longer response that also contributes to the token count increase'
      );
      const updatedCount = estimateTokenCount(updatedContext);
      
      expect(updatedCount).toBeGreaterThan(initialCount);
    });

    it('should handle empty conversation history', () => {
      const context = createConversationContext(mockAnalysis);
      const tokenCount = estimateTokenCount(context);
      
      expect(tokenCount).toBeGreaterThan(0); // Should still count system and analysis messages
    });
  });

  describe('isConversationTooLong', () => {
    it('should return false for short conversations', () => {
      const context = createConversationContext(mockAnalysis);
      const isTooLong = isConversationTooLong(context);
      
      expect(isTooLong).toBe(false);
    });

    it('should respect custom maxTokens parameter', () => {
      const context = createConversationContext(mockAnalysis);
      const isTooLong = isConversationTooLong(context, 1); // Very low limit
      
      expect(isTooLong).toBe(true);
    });

    it('should use default maxTokens when not specified', () => {
      const context = createConversationContext(mockAnalysis);
      const defaultResult = isConversationTooLong(context);
      const explicitResult = isConversationTooLong(context, 8000);
      
      expect(defaultResult).toBe(explicitResult);
    });
  });

  describe('createConversationSummary', () => {
    it('should create summary from user messages only', () => {
      let context = createConversationContext(mockAnalysis);
      context = addToConversation(context, 'Remove flowery language', 'Updated letter');
      context = addToConversation(context, 'Make it more technical', 'More technical letter');
      
      const summary = createConversationSummary(context);
      
      expect(summary).toContain('Previous instructions included:');
      expect(summary).toContain('Remove flowery language');
      expect(summary).toContain('Make it more technical');
      expect(summary).not.toContain('Updated letter'); // Assistant responses excluded
      expect(summary).not.toContain('More technical letter'); // Assistant responses excluded
    });

    it('should handle conversation with no user messages', () => {
      const context = createConversationContext(mockAnalysis);
      const summary = createConversationSummary(context);
      
      expect(summary).toContain('Previous instructions included:');
      expect(summary).toBe('Previous instructions included: ');
    });

    it('should join multiple instructions with semicolons', () => {
      let context = createConversationContext(mockAnalysis);
      context = addToConversation(context, 'First instruction', 'First response');
      context = addToConversation(context, 'Second instruction', 'Second response');
      
      const summary = createConversationSummary(context);
      
      expect(summary).toBe('Previous instructions included: First instruction; Second instruction');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete conversation workflow', () => {
      // Create initial context
      let context = createConversationContext(mockAnalysis, 'Sample cover letter content');
      
      // Add multiple iterations
      context = addToConversation(context, 'Remove all flowery language', 'Professional letter v1');
      context = addToConversation(context, 'Add more technical details', 'Technical letter v2');
      context = addToConversation(context, 'Make it shorter and more concise', 'Concise letter v3');
      
      // Verify final state
      expect(context.conversationHistory).toHaveLength(6); // 3 instructions + 3 responses
      expect(estimateTokenCount(context)).toBeGreaterThan(0);
      
      // Test formatting for AI
      const formatted = formatConversationForAI(context, 'Final adjustment');
      expect(formatted.messages).toHaveLength(8); // analysis + 6 history + new instruction
      
      // Test summary
      const summary = createConversationSummary(context);
      expect(summary).toContain('Remove all flowery language');
      expect(summary).toContain('Add more technical details');
      expect(summary).toContain('Make it shorter and more concise');
    });
  });
});
