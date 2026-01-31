import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { SavedAnalysis, CoverLetter, ServiceName } from '../types';
import type { CoverLetterConversation } from '../types/conversation';
import { StorageService } from '../services/StorageService';
import { CoverLetterService } from '../services/CoverLetterService';
import { diffWords } from 'diff';

export function useCoverLetter() {
  const route = useRoute();
  const router = useRouter();
  const analysisId = route.params.id as string;

  // State
  const analysis = ref<SavedAnalysis | null>(null);
  const error = ref('');
  const sampleLetter = ref('');
  const coverLetter = reactive<CoverLetter>({
    content: '',
    timestamp: '',
    sampleContent: '',
    history: [],
    editedSections: []
  });
  const isGenerating = ref(false);
  const showRegenerateDialog = ref(false);
  const regenerateInstructions = ref('');
  const regenerateOption = ref('keep');
  const originalContent = ref('');
  const showSampleDialog = ref(false);
  const selectedSampleId = ref('');
  const savedAnalyses = ref<SavedAnalysis[]>([]);
  const selectedService = ref<ServiceName>('gemini'); // Default service
  const currentConversation = ref<CoverLetterConversation | null>(null);

  // Track manual edits
  const hasManualEdits = computed(() => {
    return originalContent.value !== coverLetter.content;
  });

  // Handle content changes on blur
  const handleContentBlur = () => {
    if (!originalContent.value) {
      originalContent.value = coverLetter.content;
      return;
    }

    if (coverLetter.content !== originalContent.value) {
      // Use diff library to find changes
      const changes = diffWords(originalContent.value, coverLetter.content);
      const edits = changes
        .filter(change => change.added || change.removed)
        .map(change => ({
          type: change.added ? 'added' as const : 'removed' as const,
          value: change.value,
          timestamp: new Date().toISOString()
        }));

      if (edits.length > 0) {
        // Add current version to history
        coverLetter.history.push({
          content: originalContent.value,
          timestamp: new Date().toISOString(),
          edits
        });

        // Update original content
        originalContent.value = coverLetter.content;
      }
    }
  };

  // Fetch analysis data and selected service on mount
  onMounted(async () => {
    try {
      // Load selected service from localStorage
      const storedService = localStorage.getItem('selected-llm-service');
      if (storedService && ['gemini', 'anthropic', 'openai', 'mock'].includes(storedService)) {
        selectedService.value = storedService as ServiceName;
      }

      savedAnalyses.value = await StorageService.getAnalyses();
      const foundAnalysis = savedAnalyses.value.find(a => a.id === analysisId);
      
      if (foundAnalysis) {
        analysis.value = foundAnalysis;
        if (foundAnalysis.coverLetter) {
          coverLetter.content = foundAnalysis.coverLetter.content;
          coverLetter.timestamp = foundAnalysis.coverLetter.timestamp;
          coverLetter.sampleContent = foundAnalysis.coverLetter.sampleContent || '';
          coverLetter.history = foundAnalysis.coverLetter.history || [];
          coverLetter.editedSections = foundAnalysis.coverLetter.editedSections || [];
          originalContent.value = coverLetter.content;
        }
        
        // Try to load existing conversation for this analysis
        try {
          console.log('[useCoverLetter] Loading conversations for analysis:', analysisId);
          const conversations = await StorageService.getConversations();
          console.log('[useCoverLetter] Received conversations:', typeof conversations, 'isArray:', Array.isArray(conversations));
          
          // Validate that conversations is an array before using .find()
          if (!Array.isArray(conversations)) {
            console.error('[useCoverLetter] ERROR: getConversations returned non-array:', typeof conversations, conversations);
            console.error('[useCoverLetter] Cannot search conversations - not an array');
            // Continue without conversation rather than crashing
          } else {
            console.log(`[useCoverLetter] Searching ${conversations.length} conversations for analysisId: ${analysisId}`);
            const existingConversation = conversations.find(c => c.analysisId === analysisId);
            if (existingConversation) {
              console.log('[useCoverLetter] Found existing conversation:', existingConversation.id);
              currentConversation.value = existingConversation;
            } else {
              console.log('[useCoverLetter] No existing conversation found for this analysis');
            }
          }
        } catch (err) {
          console.error('[useCoverLetter] Could not load conversation history:', err);
          console.error('[useCoverLetter] Error type:', err instanceof Error ? err.constructor.name : typeof err);
          console.error('[useCoverLetter] Error message:', err instanceof Error ? err.message : String(err));
          // Not a critical error, continue without conversation
        }
      } else {
        error.value = 'Analysis not found';
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      error.value = err instanceof Error ? err.message : 'Failed to load analysis';
    }
  });

  // Watch for changes in selectedService and save to localStorage
  watch(selectedService, (newService) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected-llm-service', newService);
    }
  });

  const generateCoverLetter = async () => {
    if (!analysis.value) return;
    
    isGenerating.value = true;
    error.value = '';
    
    try {
      const result = await CoverLetterService.generateCoverLetter(
        analysis.value,
        currentConversation.value?.id, // Use existing conversation if available
        sampleLetter.value,
        undefined, // No instructions for initial generation
        undefined, // No reference content for initial generation
        selectedService.value
      );
      
      coverLetter.content = result.coverLetter.content;
      coverLetter.timestamp = result.coverLetter.timestamp;
      coverLetter.sampleContent = sampleLetter.value;
      originalContent.value = coverLetter.content;
      coverLetter.editedSections = [];
      
      // Update conversation state
      currentConversation.value = result.conversation;
      
      await saveCoverLetter();
      
    } catch (err) {
      console.error('Error generating cover letter:', err);
      error.value = err instanceof Error ? err.message : 'Failed to generate cover letter';
    } finally {
      isGenerating.value = false;
    }
  };

  const handleRegenerate = async () => {
    if (!analysis.value) return;
    
    coverLetter.history.push({
      content: coverLetter.content,
      timestamp: coverLetter.timestamp,
      instructions: regenerateInstructions.value,
      sampleContent: sampleLetter.value
    });

    const referenceContent = regenerateOption.value === 'keep' ? coverLetter.content : undefined;
    
    isGenerating.value = true;
    showRegenerateDialog.value = false;
    
    try {
      const result = await CoverLetterService.generateCoverLetter(
        analysis.value,
        currentConversation.value?.id, // Use existing conversation
        sampleLetter.value,
        regenerateInstructions.value,
        referenceContent,
        selectedService.value
      );
      
      coverLetter.content = result.coverLetter.content;
      coverLetter.timestamp = result.coverLetter.timestamp;
      originalContent.value = coverLetter.content;
      
      // Update conversation state
      currentConversation.value = result.conversation;
      
      await saveCoverLetter();
      regenerateInstructions.value = '';
      regenerateOption.value = 'keep';
      
    } catch (err) {
      console.error('Error regenerating cover letter:', err);
      error.value = err instanceof Error ? err.message : 'Failed to regenerate cover letter';
    } finally {
      isGenerating.value = false;
    }
  };

  const saveCoverLetter = async () => {
    if (!analysis.value) return;
    
    try {
      await StorageService.saveCoverLetter(analysisId, {
        content: coverLetter.content,
        timestamp: new Date().toISOString(),
        sampleContent: sampleLetter.value,
        history: coverLetter.history,
        editedSections: coverLetter.editedSections
      });
      
    } catch (err) {
      console.error('Error saving cover letter:', err);
      error.value = err instanceof Error ? err.message : 'Failed to save cover letter';
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter.content);
      // Show success message or toast
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      error.value = err instanceof Error ? err.message : 'Failed to copy to clipboard';
    }
  };

  const handleSampleSelect = (sample: { content: string }) => {
    sampleLetter.value = sample.content;
  };

  const handleSampleSave = async (data: { name: string; notes: string }) => {
    try {
      await StorageService.saveCoverLetterSample({
        content: coverLetter.content,
        name: data.name,
        notes: data.notes || `Generated from analysis: ${analysis.value?.jobTitle || 'Untitled Position'}`
      });
      showSampleDialog.value = false;
    } catch (err) {
      console.error('Error saving cover letter sample:', err);
      error.value = err instanceof Error ? err.message : 'Failed to save cover letter sample';
    }
  };

  const loadSavedAnalysis = (selectedAnalysis: SavedAnalysis) => {
    // Update the URL to reflect the new analysis
    router.replace({
      path: `/cover-letter/${selectedAnalysis.id}`,
      query: {} // No need for query params anymore
    });
    
    // Load the analysis data
    analysis.value = selectedAnalysis;
    
    // Load the cover letter if it exists
    if (selectedAnalysis.coverLetter) {
      coverLetter.content = selectedAnalysis.coverLetter.content;
      coverLetter.timestamp = selectedAnalysis.coverLetter.timestamp;
      coverLetter.sampleContent = selectedAnalysis.coverLetter.sampleContent || '';
      coverLetter.history = selectedAnalysis.coverLetter.history || [];
      coverLetter.editedSections = selectedAnalysis.coverLetter.editedSections || [];
      originalContent.value = coverLetter.content;
    } else {
      // Reset cover letter if none exists
      coverLetter.content = '';
      coverLetter.timestamp = '';
      coverLetter.sampleContent = '';
      coverLetter.history = [];
      coverLetter.editedSections = [];
      originalContent.value = '';
    }
  };

  const deleteSavedAnalysis = async (id: string) => {
    try {
      await StorageService.deleteAnalysis(id);
      savedAnalyses.value = await StorageService.getAnalyses();
      
      // If we deleted the current analysis, redirect to the analyze page
      if (id === analysisId) {
        router.push('/analyze');
      }
    } catch (err) {
      console.error('Error deleting analysis:', err);
      error.value = err instanceof Error ? err.message : 'Failed to delete analysis';
    }
  };

  return {
    analysis,
    error,
    sampleLetter,
    coverLetter,
    isGenerating,
    showRegenerateDialog,
    regenerateInstructions,
    regenerateOption,
    originalContent,
    showSampleDialog,
    selectedSampleId,
    savedAnalyses,
    selectedService,
    currentConversation,
    hasManualEdits,
    handleContentBlur,
    generateCoverLetter,
    handleRegenerate,
    saveCoverLetter,
    copyToClipboard,
    handleSampleSelect,
    handleSampleSave,
    loadSavedAnalysis,
    deleteSavedAnalysis,
  };
}