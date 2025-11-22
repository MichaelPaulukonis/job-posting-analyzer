// ...existing code...
<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Upwork Proposal Generator</h1>
    
    <!-- Job Posting Input Section -->
    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Job Posting</h2>
      <InputContainer
        title="Upwork Job Posting"
        description="Paste the job posting from Upwork to analyze requirements and generate a tailored proposal."
      >
        <TextAreaInput
          v-model="jobPosting"
          placeholder="Paste the complete Upwork job posting here..."
          :rows="8"
          :error="jobPostingError"
          @input="clearJobPostingError"
        />
        <div class="mt-2">
          <label class="inline-flex items-center">
            <input
              v-model="useMemory"
              type="checkbox"
              class="form-checkbox h-4 w-4 text-blue-600"
            >
            <span class="ml-2 text-sm text-gray-700">
              Use memory of my career and writing style
            </span>
          </label>
        </div>
      </InputContainer>
    </section>

    <!-- Resume Selection Section -->
    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Resume</h2>
      <InputContainer
        title="Select Resume"
        description="Choose which resume version to use for this proposal."
      >
        <ResumeSelector
          v-model="selectedResume"
          :resumes="savedResumes"
          @select="handleResumeSelect"
          @delete="deleteResume"
        />
      </InputContainer>
    </section>

    <!-- Analysis Controls -->
    <section class="mb-8">
      <div class="flex gap-4">
        <button
          @click="analyzeJob"
          :disabled="isAnalyzing || !canAnalyze"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isAnalyzing">Analyzing...</span>
          <span v-else>Analyze & Generate Proposal</span>
        </button>
        
        <button
          v-if="hasResults"
          @click="clearResults"
          class="bg-gray-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>
    </section>

    <!-- Error Display -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Analysis Results -->
    <section v-if="hasResults" class="space-y-8">
      <!-- Job Suitability Analysis -->
      <div v-if="analysis" class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-semibold mb-4">Job Suitability Analysis</h3>
        <div class="prose max-w-none">
          <div v-html="formatAnalysisText(analysis)"></div>
        </div>
      </div>

      <!-- Generated Proposal -->
      <div v-if="proposal" class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center justify-between">
          Upwork Proposal
          <button
            @click="copyProposal"
            class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Copy to Clipboard
          </button>
        </h3>
        <div class="prose max-w-none">
          <div v-html="formatProposalText(proposal)"></div>
        </div>
      </div>

      <!-- Streaming Output -->
      <div v-if="isGenerating && streamingOutput" class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-xl font-semibold mb-4">Generating...</h3>
        <div class="prose max-w-none">
          <div v-html="formatStreamingText(streamingOutput)"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from '#imports';
import type { ResumeEntry } from '~/types';
import { StorageService } from '~/services/StorageService';

// Component imports following existing patterns
import InputContainer from '~/components/input/InputContainer.vue';
import TextAreaInput from '~/components/input/TextAreaInput.vue';
import ResumeSelector from '~/components/input/ResumeSelector.vue';

// Page metadata
useHead({
  title: 'Upwork Proposal Generator',
  meta: [
    { name: 'description', content: 'Generate tailored Upwork proposals based on job postings and your resume.' }
  ]
});

definePageMeta({
  middleware: ['auth'],
  requiresAuth: true
});

// TypeScript interfaces for API responses
interface UpworkAnalysisResponse {
  analysis: string;
  success: boolean;
}

interface UpworkProposalResponse {
  proposal: string;
  success: boolean;
}

// Reactive state
const jobPosting = ref('');
const selectedResume = ref('');
const useMemory = ref(false);
const isAnalyzing = ref(false);
const isGenerating = ref(false);
const error = ref('');
const jobPostingError = ref('');
const resumeError = ref('');

// Resume management state
const savedResumes = ref<ResumeEntry[]>([]);

// Results state
const analysis = ref('');
const proposal = ref('');
const streamingOutput = ref('');

// Computed properties
const canAnalyze = computed(() => {
  return jobPosting.value.trim() !== '' && selectedResume.value !== '';
});

const hasResults = computed(() => {
  return analysis.value || proposal.value || streamingOutput.value;
});

// Error handling methods
const clearJobPostingError = () => {
  jobPostingError.value = '';
};

const clearResumeError = () => {
  resumeError.value = '';
};

const clearError = () => {
  error.value = '';
};

// Resume management methods
const loadResumes = async () => {
  try {
    savedResumes.value = await StorageService.getResumes();
  } catch (err) {
    console.error('Failed to load resumes:', err);
  }
};

const handleResumeSelect = (resume: ResumeEntry) => {
  selectedResume.value = resume.id;
  clearResumeError();
};

const deleteResume = async (resumeId: string) => {
  try {
    await StorageService.deleteResume(resumeId);
    await loadResumes();
    if (selectedResume.value === resumeId) {
      selectedResume.value = '';
    }
  } catch (err) {
    console.error('Failed to delete resume:', err);
    error.value = 'Failed to delete resume';
  }
};

// Initialize data on mount
onMounted(() => {
  loadResumes();
});

// Validation methods
const validateInputs = () => {
  let isValid = true;
  
  if (!jobPosting.value.trim()) {
    jobPostingError.value = 'Job posting is required';
    isValid = false;
  }
  
  if (!selectedResume.value) {
    resumeError.value = 'Resume selection is required';
    isValid = false;
  }
  
  return isValid;
};

// Main analysis method
const analyzeJob = async () => {
  clearError();
  
  if (!validateInputs()) {
    return;
  }
  
  isAnalyzing.value = true;
  analysis.value = '';
  proposal.value = '';
  streamingOutput.value = '';
  
  try {
    // TODO: Implement API call to new upwork analysis endpoint
    // This will follow the pattern from cover-letter generation
    // with streaming support and multi-step workflow
    
    const response = await $fetch<UpworkAnalysisResponse>('/api/upwork/analyze', {
      method: 'POST',
      body: {
        jobPosting: jobPosting.value,
        resumeId: selectedResume.value,
        useMemory: useMemory.value
      }
    });
    
    // Handle the response (will be implemented with streaming)
    analysis.value = response.analysis;
    
    // Start proposal generation after analysis
    await generateProposal();
    
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'An error occurred during analysis';
  } finally {
    isAnalyzing.value = false;
  }
};

// Proposal generation method
const generateProposal = async () => {
  isGenerating.value = true;
  
  try {
    // TODO: Implement streaming proposal generation
    // Following pattern from cover-letter/generate.ts
    
    const response = await $fetch<UpworkProposalResponse>('/api/upwork/generate', {
      method: 'POST',
      body: {
        jobPosting: jobPosting.value,
        resumeId: selectedResume.value,
        analysis: analysis.value,
        useMemory: useMemory.value
      }
    });
    
    proposal.value = response.proposal;
    
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'An error occurred during proposal generation';
  } finally {
    isGenerating.value = false;
  }
};

// Utility methods
const clearResults = () => {
  analysis.value = '';
  proposal.value = '';
  streamingOutput.value = '';
  error.value = '';
};

const copyProposal = async () => {
  try {
    await navigator.clipboard.writeText(proposal.value);
    // TODO: Add toast notification for copy success
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
};

// Text formatting methods (will be enhanced for proper formatting)
const formatAnalysisText = (text: string) => {
  return text.replace(/\n/g, '<br>');
};

const formatProposalText = (text: string) => {
  return text.replace(/\n/g, '<br>');
};

const formatStreamingText = (text: string) => {
  return text.replace(/\n/g, '<br>');
};
</script>

<style scoped>
.prose {
  max-width: none;
}

.prose p {
  margin-bottom: 1rem;
}

.prose h1, .prose h2, .prose h3, .prose h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.prose ul, .prose ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.prose li {
  margin-bottom: 0.5rem;
}
</style>