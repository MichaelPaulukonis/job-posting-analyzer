import CoverLetterSampleSelector from '~/components/input/CoverLetterSampleSelector.vue';
import CoverLetterSampleDialog from '~/components/input/CoverLetterSampleDialog.vue';
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { SavedAnalysis } from '../types';
import { StorageService } from '../services/StorageService';
import { AnalysisService } from '../services/AnalysisService';
import InputContainer from '../components/input/InputContainer.vue';
import TextAreaInput from '../components/input/TextAreaInput.vue';
import AnalysisHistory from '../components/analysis/AnalysisHistory.vue';

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">✍️ Cover Letter Generator</h1>
      <button @click="clearFormFields" 
        class="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-4 rounded-md transition-colors"
        title="Clear all form fields">
        <span class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Form
        </span>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content area - 2/3 width on large screens -->
      <div class="lg:col-span-2">
        <InputContainer ref="coverLetterContainer" title="Cover Letter" summary="Your generated cover letter">
          <div class="space-y-4">
            <CoverLetterSampleSelector
              v-model="selectedSampleId"
              @select="handleSampleSelect"
            />
            <TextAreaInput
              id="cover-letter"
              label="Cover Letter"
              v-model="coverLetter"
              placeholder="Your cover letter will appear here..."
              :rows="15"
              class="w-full"
            />
            <div class="flex justify-between items-center">
              <div class="space-x-2">
                <button
                  @click="generateCoverLetter"
                  :disabled="!canGenerate || isGenerating"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isGenerating" class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                  <span v-else>Generate Cover Letter</span>
                </button>
                <button
                  @click="regenerateCoverLetter"
                  :disabled="!canRegenerate || isGenerating"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regenerate
                </button>
              </div>
              <div class="space-x-2">
                <button
                  @click="saveCurrentVersion"
                  :disabled="!isCoverLetterValid"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Version
                </button>
                <button
                  @click="saveSample"
                  :disabled="!isCoverLetterValid"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save as Sample
                </button>
                <button
                  @click="copyToClipboard"
                  :disabled="!isCoverLetterValid"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
            <!-- Version History -->
            <div v-if="coverLetterVersions.length > 0" class="mt-4">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Version History</h3>
              <div class="space-y-2">
                <button
                  v-for="(version, index) in coverLetterVersions"
                  :key="version.timestamp"
                  @click="loadVersion(index)"
                  :class="[
                    'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                    currentVersionIndex === index
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  ]"
                >
                  <div class="flex justify-between items-center">
                    <span>Version {{ index + 1 }}</span>
                    <span class="text-xs text-gray-500">
                      {{ new Date(version.timestamp).toLocaleString() }}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </InputContainer>
      </div>

      <!-- Sidebar - 1/3 width on large screens -->
      <div class="lg:col-span-1">
        <AnalysisHistory :items="savedAnalyses" @select="loadSavedAnalysis" @delete="deleteSavedAnalysis"
          @clear="clearSavedAnalyses" />
      </div>
    </div>

    <!-- Cover Letter Sample Dialog -->
    <CoverLetterSampleDialog
      v-model="showSampleDialog"
      :preview="coverLetter"
      @save="handleSampleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { SavedAnalysis } from '../types';
import { StorageService } from '../services/StorageService';
import { AnalysisService } from '../services/AnalysisService';
import InputContainer from '../components/input/InputContainer.vue';
import TextAreaInput from '../components/input/TextAreaInput.vue';
import AnalysisHistory from '../components/analysis/AnalysisHistory.vue';
import CoverLetterSampleSelector from '~/components/input/CoverLetterSampleSelector.vue';
import CoverLetterSampleDialog from '~/components/input/CoverLetterSampleDialog.vue';

// State
const route = useRoute();
const router = useRouter();
const coverLetter = ref('');
const showSampleDialog = ref(false);
const selectedSampleId = ref<string>('');
const savedAnalyses = ref<SavedAnalysis[]>([]);
const isGenerating = ref(false);
const currentAnalysisId = ref<string | undefined>(undefined);
const coverLetterVersions = ref<Array<{ content: string; timestamp: string }>>([]);
const currentVersionIndex = ref<number>(-1);

// Watch for route changes to handle navigation
watch(() => route.params.id || route.query.analysisId, async (newId) => {
  if (!newId) return;
  
  // Clear any existing state
  clearFormFields();
  
  // Load the analysis
  const analysis = savedAnalyses.value.find(a => a.id === newId);
  if (analysis) {
    loadSavedAnalysis(analysis);
  }
}, { immediate: true });

// Load saved analyses on mount
onMounted(async () => {
  savedAnalyses.value = await StorageService.getAnalyses();
  
  // If we have an ID in the URL, load that analysis
  const id = route.params.id || route.query.analysisId;
  if (id) {
    const analysis = savedAnalyses.value.find(a => a.id === id);
    if (analysis) {
      loadSavedAnalysis(analysis);
    }
  }
});

const isCoverLetterValid = computed(() => {
  return coverLetter.value && coverLetter.value.trim().length >= 10;
});

const canGenerate = computed(() => {
  return currentAnalysisId.value !== undefined;
});

const canRegenerate = computed(() => {
  return canGenerate.value && coverLetter.value.trim().length > 0;
});

const handleSampleSelect = (sample: { content: string }) => {
  coverLetter.value = sample.content;
};

const generateCoverLetter = async () => {
  if (!canGenerate.value || isGenerating.value) return;
  
  isGenerating.value = true;
  try {
    const analysis = savedAnalyses.value.find(a => a.id === currentAnalysisId.value);
    if (!analysis) throw new Error('Analysis not found');

    const result = await AnalysisService.generateCoverLetter(
      analysis.jobPosting,
      analysis.resume,
      'gemini' // or use a service selector like in analyze.vue
    );

    // Add new version to history
    coverLetterVersions.value.push({
      content: result.content,
      timestamp: new Date().toISOString()
    });
    currentVersionIndex.value = coverLetterVersions.value.length - 1;
    coverLetter.value = result.content;
    
    // Save the generated cover letter to the analysis
    if (currentAnalysisId.value) {
      await StorageService.saveCoverLetter(currentAnalysisId.value, {
        content: result.content,
        timestamp: new Date().toISOString(),
        versions: coverLetterVersions.value
      });
    }
  } catch (error) {
    console.error('Error generating cover letter:', error);
    // You might want to show an error message to the user here
  } finally {
    isGenerating.value = false;
  }
};

const regenerateCoverLetter = async () => {
  if (!canRegenerate.value || isGenerating.value) return;
  await generateCoverLetter();
};

const saveCurrentVersion = async () => {
  if (!currentAnalysisId.value || !coverLetter.value) return;

  // Add current content as new version if it's different from the last version
  const lastVersion = coverLetterVersions.value[coverLetterVersions.value.length - 1];
  if (!lastVersion || lastVersion.content !== coverLetter.value) {
    coverLetterVersions.value.push({
      content: coverLetter.value,
      timestamp: new Date().toISOString()
    });
    currentVersionIndex.value = coverLetterVersions.value.length - 1;
  }

  // Save to analysis
  await StorageService.saveCoverLetter(currentAnalysisId.value, {
    content: coverLetter.value,
    timestamp: new Date().toISOString(),
    versions: coverLetterVersions.value
  });
};

const loadVersion = (index: number) => {
  if (index >= 0 && index < coverLetterVersions.value.length) {
    currentVersionIndex.value = index;
    coverLetter.value = coverLetterVersions.value[index].content;
  }
};

const saveSample = () => {
  if (!isCoverLetterValid.value) return;
  showSampleDialog.value = true;
};

const handleSampleSave = async (data: { name: string; notes: string }) => {
  try {
    await StorageService.saveCoverLetterSample({
      name: data.name,
      content: coverLetter.value,
      notes: data.notes
    });
    showSampleDialog.value = false;
  } catch (error) {
    console.error('Error saving cover letter sample:', error);
    // You might want to show an error message to the user here
  }
};

const copyToClipboard = () => {
  if (!isCoverLetterValid.value) return;
  navigator.clipboard.writeText(coverLetter.value);
};

const clearFormFields = () => {
  coverLetter.value = '';
  selectedSampleId.value = '';
  currentAnalysisId.value = undefined;
  coverLetterVersions.value = [];
  currentVersionIndex.value = -1;

  // Clear URL parameters
  router.replace({
    path: '/cover-letter',
    query: {}
  });
};

const loadSavedAnalysis = (analysis: SavedAnalysis) => {
  // Clear any existing state
  coverLetter.value = '';
  selectedSampleId.value = '';
  coverLetterVersions.value = [];
  currentVersionIndex.value = -1;
  
  // Set the current analysis
  currentAnalysisId.value = analysis.id;
  
  // Load the cover letter if it exists
  if (analysis.coverLetter) {
    coverLetter.value = analysis.coverLetter.content;
    coverLetterVersions.value = analysis.coverLetter.versions || [];
    currentVersionIndex.value = coverLetterVersions.value.length - 1;
  }

  // Update URL to use path parameter instead of query
  router.replace({
    path: `/cover-letter/${analysis.id}`,
    query: {}
  });
};

const deleteSavedAnalysis = async (id: string) => {
  await StorageService.deleteAnalysis(id);
  savedAnalyses.value = await StorageService.getAnalyses();
  if (currentAnalysisId.value === id) {
    clearFormFields();
  }
};

const clearSavedAnalyses = async () => {
  await StorageService.clearAnalyses();
  savedAnalyses.value = [];
  clearFormFields();
};
</script> 