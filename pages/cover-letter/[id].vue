<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
      <NuxtLink :to="`/analyze/${route.params.id}`" class="text-blue-600 hover:underline flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Analysis
      </NuxtLink>
      <h1 class="text-2xl font-bold text-center md:text-left">📝 Cover Letter Generator</h1>
    </div>

    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      <p>{{ error }}</p>
    </div>

    <div v-if="!analysis" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading analysis...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content area - 2/3 width on large screens -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <!-- Summary and skill matches -->
        <div class="bg-white shadow-md rounded-lg p-6 mb-0">
          <div class="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 class="text-xl font-semibold">Job: {{ analysis?.jobTitle || 'Untitled Position' }}</h2>
            <div class="flex gap-4">
              <div class="flex items-center"><div class="w-3 h-3 rounded-full bg-green-500 mr-2"></div><span class="font-medium">Matches: {{ (analysis?.matches || []).length }}</span></div>
              <div class="flex items-center"><div class="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div><span class="font-medium">Potential: {{ (analysis?.maybes || []).length }}</span></div>
              <div class="flex items-center"><div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div><span class="font-medium">Gaps: {{ (analysis?.gaps || []).length }}</span></div>
            </div>
          </div>
        </div>

        <!-- Cover letter editor -->
        <div class="bg-white shadow-md rounded-lg p-6 flex flex-col gap-4">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
            <h2 class="text-xl font-semibold">Cover Letter</h2>
            <div class="flex flex-wrap gap-2">
              <button 
                @click="showRegenerateDialog = true"
                class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Regenerate
              </button>
              <button 
                @click="copyToClipboard"
                class="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Copy to Clipboard
              </button>
              <button 
                @click="saveCoverLetter"
                class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          <div v-if="isGenerating" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Generating cover letter...</p>
          </div>

          <div v-else>
            <TextAreaInput
              id="cover-letter"
              label="Cover Letter"
              v-model="coverLetter.content"
              :rows="12"
              hint="You can edit this cover letter as needed"
              @blur="handleContentBlur"
            />
          </div>
        </div>

        <!-- Analysis Settings moved here -->
        <div class="bg-white shadow-md rounded-lg p-6">
          <h2 class="text-xl font-semibold mb-4">Analysis Settings</h2>
          <ServiceSelector v-model="selectedService" />
        </div>
      </div>

      <!-- Sidebar - 1/3 width on large screens -->
      <div class="lg:col-span-1 flex flex-col gap-6">
        <div class="bg-white shadow-md rounded-lg p-6 mb-0">
          <h2 class="text-xl font-semibold mb-4">Sample Cover Letter</h2>
          <TextAreaInput
            id="sample-letter"
            label="Paste a sample cover letter (optional)"
            v-model="sampleLetter"
            :rows="4"
            hint="This will be used as a style reference for generating your cover letter"
          />
          <div class="mt-4 flex flex-col gap-2">
            <CoverLetterSampleSelector
              v-model="selectedSampleId"
              @select="handleSampleSelect"
            />
            <button 
              @click="generateCoverLetter"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors mt-2"
              :disabled="isGenerating"
            >
              Generate Cover Letter
            </button>
            <button 
              @click="showSampleDialog = true"
              class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
              :disabled="!coverLetter.content"
            >
              Save as Sample
            </button>
          </div>
        </div>

        <div class="bg-white shadow-md rounded-lg p-6">
          <AnalysisHistory 
            :items="savedAnalyses" 
            @select="loadSavedAnalysis" 
            @delete="deleteSavedAnalysis"
          />
        </div>
      </div>
    </div>

    <!-- Regenerate Dialog -->
    <div v-if="showRegenerateDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Regenerate Cover Letter</h3>
        <div class="mb-4">
          <TextAreaInput
            id="regenerate-instructions"
            label="Instructions (Optional)"
            v-model="regenerateInstructions"
            placeholder="E.g., 'Make it more professional', 'Focus on technical skills', 'Change the second paragraph'"
            :rows="3"
          />
        </div>
        <div v-if="hasManualEdits" class="mb-4 p-4 bg-yellow-50 rounded-md">
          <p class="text-yellow-800">
            You have made manual edits to the current letter. Would you like to:
          </p>
          <div class="mt-2 space-y-2">
            <label class="flex items-center">
              <input type="radio" v-model="regenerateOption" value="keep" class="mr-2">
              Keep my edits and use them as a reference
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="regenerateOption" value="discard" class="mr-2">
              Discard my edits and start fresh
            </label>
          </div>
        </div>
        <div class="flex justify-end space-x-2">
          <button 
            @click="showRegenerateDialog = false"
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button 
            @click="handleRegenerate"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>

    <!-- Cover Letter Sample Dialog -->
    <CoverLetterSampleDialog
      v-model="showSampleDialog"
      :preview="coverLetter.content"
      @save="handleSampleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { SavedAnalysis, CoverLetter, ServiceName } from '../../types';
import { StorageService } from '../../services/StorageService';
import { CoverLetterService } from '../../services/CoverLetterService';
import TextAreaInput from '../../components/input/TextAreaInput.vue';
import ServiceSelector from '../../components/input/ServiceSelector.vue'; // Import ServiceSelector
import { diffWords } from 'diff';
import CoverLetterSampleSelector from '../../components/input/CoverLetterSampleSelector.vue';
import CoverLetterSampleDialog from '../../components/input/CoverLetterSampleDialog.vue';
import AnalysisHistory from '../../components/analysis/AnalysisHistory.vue';

// Get analysis ID from route param
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
    const generated = await CoverLetterService.generateCoverLetter(
      analysis.value,
      sampleLetter.value,
      undefined, // No instructions for initial generation
      undefined, // No reference content for initial generation
      selectedService.value // Pass the selected service
    );
    
    coverLetter.content = generated.content;
    coverLetter.timestamp = generated.timestamp;
    coverLetter.sampleContent = sampleLetter.value;
    originalContent.value = coverLetter.content;
    coverLetter.editedSections = [];
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
    const generated = await CoverLetterService.generateCoverLetter(
      analysis.value,
      sampleLetter.value,
      regenerateInstructions.value,
      referenceContent,
      selectedService.value // Pass the selected service
    );
    
    coverLetter.content = generated.content;
    coverLetter.timestamp = generated.timestamp;
    coverLetter.instructions = regenerateInstructions.value;
    originalContent.value = coverLetter.content;
    coverLetter.editedSections = [];
    await saveCoverLetter();
    
  } catch (err) {
    console.error('Error generating cover letter:', err);
    error.value = err instanceof Error ? err.message : 'Failed to generate cover letter';
  } finally {
    isGenerating.value = false;
    regenerateInstructions.value = '';
    regenerateOption.value = 'keep';
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
</script>

<style scoped>
</style>
