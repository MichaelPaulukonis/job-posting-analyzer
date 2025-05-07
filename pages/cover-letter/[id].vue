<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="loading" class="text-center py-12">
      <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm rounded-md text-blue-800 bg-blue-100">
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading analysis data...
      </div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      <p>{{ error }}</p>
      <div class="mt-4">
        <NuxtLink to="/analyze" class="text-blue-600 hover:underline">Return to Analysis</NuxtLink>
      </div>
    </div>
    
    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Cover Letter Generator</h1>
        <NuxtLink to="/analyze" class="text-blue-600 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Back to Analysis
        </NuxtLink>
      </div>
      
      <div class="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Job: {{ analysis?.jobTitle || 'Untitled Position' }}</h2>
        
        <div class="mb-6 p-4 bg-gray-50 rounded-md">
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <h3 class="font-medium">Matching Skills: {{ analysis?.matches.length || 0 }}</h3>
          </div>
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <h3 class="font-medium">Potential Matches: {{ analysis?.maybes.length || 0 }}</h3>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <h3 class="font-medium">Skill Gaps: {{ analysis?.gaps.length || 0 }}</h3>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Sample Cover Letter Input -->
        <div class="bg-white shadow-md rounded-lg p-6">
          <h2 class="text-xl font-semibold mb-4">Sample Cover Letter (Optional)</h2>
          <p class="text-sm text-gray-600 mb-4">
            You can provide a sample cover letter to use as a style reference.
            The generator will mimic your tone and structure.
          </p>
          
          <div class="mb-4">
            <TextAreaInput
              id="sample-letter"
              label="Paste Sample Cover Letter"
              v-model="sampleLetter"
              placeholder="Paste your sample cover letter here..."
              hint="This will be used as a style reference"
            />
          </div>
          
          <div class="mb-4">
            <FileUpload 
              id="sample-letter-upload"
              label="Upload Sample Letter"
              accept=".txt,.md,.docx"
              @file-selected="handleSampleLetterUpload"
            />
          </div>
        </div>
        
        <!-- Cover Letter Output/Generation -->
        <div class="bg-white shadow-md rounded-lg p-6">
          <h2 class="text-xl font-semibold mb-4">Generated Cover Letter</h2>
          
          <div v-if="!coverLetter.content && !isGenerating" class="text-center py-8">
            <p class="text-gray-600 mb-4">Click the button below to generate a cover letter based on your analysis results.</p>
            <button 
              @click="generateCoverLetter"
              class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Generate Cover Letter
            </button>
          </div>
          
          <div v-else-if="isGenerating" class="text-center py-8">
            <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm rounded-md text-blue-800 bg-blue-100">
              <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating your cover letter...
            </div>
          </div>
          
          <div v-else>
            <TextAreaInput
              id="generated-letter"
              label="Your Cover Letter"
              v-model="coverLetter.content"
              :rows="12"
              hint="You can edit this cover letter as needed"
              @blur="handleContentBlur"
            />
            
            <div class="flex justify-between mt-4">
              <div class="space-x-2">
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
              </div>
              
              <div class="space-x-2">
                <button 
                  @click="saveCoverLetter"
                  class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Save Changes
                </button>
                
                <button 
                  @click="downloadCoverLetter"
                  class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Download (.txt)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Regenerate Dialog -->
  <div v-if="showRegenerateDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import type { SavedAnalysis, CoverLetter } from '../../types';
import { StorageService } from '../../services/StorageService';
import { CoverLetterService } from '../../services/CoverLetterService';
import TextAreaInput from '../../components/input/TextAreaInput.vue';
import FileUpload from '../../components/input/FileUpload.vue';
import { diffWords } from 'diff';

// Get analysis ID from route param
const route = useRoute();
const analysisId = route.params.id as string;

// State
const loading = ref(true);
const error = ref('');
const analysis = ref<SavedAnalysis | null>(null);
const sampleLetter = ref('');
const coverLetter = reactive<CoverLetter>({
  content: '',
  timestamp: '',
  sampleContent: '',
  history: [],
  editedSections: []
});
const isGenerating = ref(false);
const copySuccess = ref(false);
const showRegenerateDialog = ref(false);
const regenerateInstructions = ref('');
const regenerateOption = ref('keep');
const originalContent = ref('');

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
        type: change.added ? 'added' : 'removed',
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

// Fetch analysis data on mount
onMounted(async () => {
  try {
    loading.value = true;
    
    // Get all analyses
    const analyses = await StorageService.getAnalyses();
    const foundAnalysis = analyses.find(a => a.id === analysisId);
    
    if (!foundAnalysis) {
      throw new Error('Analysis not found');
    }
    
    analysis.value = foundAnalysis;
    
    // If this analysis already has a cover letter, load it
    if (foundAnalysis.coverLetter) {
      coverLetter.content = foundAnalysis.coverLetter.content;
      coverLetter.timestamp = foundAnalysis.coverLetter.timestamp;
      
      if (foundAnalysis.coverLetter.sampleContent) {
        sampleLetter.value = foundAnalysis.coverLetter.sampleContent;
        coverLetter.sampleContent = foundAnalysis.coverLetter.sampleContent;
      }
    }
    
  } catch (err) {
    console.error('Error loading analysis:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load analysis data';
  } finally {
    loading.value = false;
  }
});

// Methods
const handleSampleLetterUpload = ({ content }: { content: string }) => {
  sampleLetter.value = content;
};

const generateCoverLetter = async () => {
  if (!analysis.value) return;
  
  isGenerating.value = true;
  
  try {
    coverLetter.sampleContent = sampleLetter.value;
    
    // Call the service to generate the cover letter
    const generated = await CoverLetterService.generateCoverLetter(
      analysis.value,
      sampleLetter.value
    );
    
    coverLetter.content = generated.content;
    coverLetter.timestamp = generated.timestamp;
    
    // Save to the analysis automatically
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
  
  // Save current version to history
  coverLetter.history.push({
    content: coverLetter.content,
    timestamp: coverLetter.timestamp,
    instructions: regenerateInstructions.value,
    sampleContent: sampleLetter.value
  });

  // If keeping edits, use current content as reference
  const referenceContent = regenerateOption.value === 'keep' ? coverLetter.content : undefined;
  
  isGenerating.value = true;
  showRegenerateDialog.value = false;
  
  try {
    // Call the service to generate the cover letter
    const generated = await CoverLetterService.generateCoverLetter(
      analysis.value,
      sampleLetter.value,
      regenerateInstructions.value,
      referenceContent
    );
    
    coverLetter.content = generated.content;
    coverLetter.timestamp = generated.timestamp;
    coverLetter.instructions = regenerateInstructions.value;
    
    // Reset tracking
    originalContent.value = coverLetter.content;
    coverLetter.editedSections = [];
    
    // Save to the analysis automatically
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
    // Update the cover letter in the analysis
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

const copyToClipboard = () => {
  navigator.clipboard.writeText(coverLetter.content)
    .then(() => {
      copySuccess.value = true;
      setTimeout(() => {
        copySuccess.value = false;
      }, 2000);
    })
    .catch(err => {
      console.error('Error copying to clipboard:', err);
    });
};

const downloadCoverLetter = () => {
  const blob = new Blob([coverLetter.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const jobTitle = analysis.value?.jobTitle || 'position';
  const fileName = `cover-letter-${jobTitle.toLowerCase().replace(/\s+/g, '-')}.txt`;
  
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};
</script>
