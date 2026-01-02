// ...existing code...
<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
      <NuxtLink :to="`/analyze/${analysisId}`" class="text-blue-600 hover:underline flex items-center">
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

        <!-- Conversation History -->
        <div class="bg-white shadow-md rounded-lg p-6">
          <ConversationHistory 
            :conversation="currentConversation || undefined"
            :can-toggle="true"
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
import { useRoute } from 'vue-router';
import { useCoverLetter } from '../../composables/useCoverLetter';
import TextAreaInput from '../../components/input/TextAreaInput.vue';
import ServiceSelector from '../../components/input/ServiceSelector.vue';
import CoverLetterSampleSelector from '../../components/input/CoverLetterSampleSelector.vue';
import CoverLetterSampleDialog from '../../components/input/CoverLetterSampleDialog.vue';
import AnalysisHistory from '../../components/analysis/AnalysisHistory.vue';
import ConversationHistory from '../../components/analysis/ConversationHistory.vue';

definePageMeta({
  middleware: ['auth'],
  requiresAuth: true
});

const route = useRoute();
const analysisId = route.params.id as string;

const {
  analysis,
  error,
  sampleLetter,
  coverLetter,
  isGenerating,
  showRegenerateDialog,
  regenerateInstructions,
  regenerateOption,
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
} = useCoverLetter();
</script>

<style scoped>
</style>
