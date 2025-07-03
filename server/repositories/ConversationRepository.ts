import { FileStorageService } from '../services/FileStorageService';
import type { CoverLetterConversation } from '~/types/conversation';

export class ConversationRepository extends FileStorageService<CoverLetterConversation> {
  constructor() {
    super('conversations.json');
  }

  /**
   * Get conversations by analysis ID
   */
  public getByAnalysisId(analysisId: string): CoverLetterConversation[] {
    const conversations = this.getAll();
    return conversations.filter(conversation => conversation.analysisId === analysisId);
  }

  /**
   * Link a conversation to an analysis by updating the analysis with the conversation ID
   */
  public linkToAnalysis(analysisId: string, conversationId: string): void {
    // This method is for consistency with the interface but actual linking
    // is handled by the AnalysisRepository when needed
    console.log(`Linking conversation ${conversationId} to analysis ${analysisId}`);
  }
}

// Create a singleton instance
const conversationRepository = new ConversationRepository();
export default conversationRepository;
