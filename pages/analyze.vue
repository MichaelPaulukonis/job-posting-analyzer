<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Analyze Job Posting</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content area - 2/3 width on large screens -->
      <div class="lg:col-span-2">
        <InputContainer 
          ref="jobPostingContainer"
          title="Job Posting"
          :summary="jobPosting.title ? `Job Title: ${jobPosting.title}` : 'Job posting content'"
        >
          <div class="flex flex-col md:flex-row gap-4 mb-4">
            <div class="md:w-1/2">
              <TextAreaInput
                id="job-posting"
                label="Paste Job Description"
                v-model="jobPosting.content"
                placeholder="Paste the job posting text here..."
                :error="errors.jobPosting"
                hint="Paste the full job description including requirements and qualifications"
              />
            </div>
            <div class="md:w-1/2">
              <FileUpload 
                id="job-file-upload"
                label="Upload Job Posting"
                accept=".txt,.md"
                :error="errors.jobPostingFile"
                @file-selected="handleJobFileUpload"
              />
            </div>
          </div>
          <div class="mb-4">
            <label for="job-title" class="block text-sm font-medium text-gray-700 mb-1">Job Title (Optional)</label>
            <input
              id="job-title"
              v-model="jobPosting.title"
              type="text"
              placeholder="Enter job title"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </InputContainer>

        <InputContainer 
          ref="resumeContainer"
          title="Your Resume"
          summary="Resume content"
        >
          <div class="flex flex-col md:flex-row gap-4">
            <div class="md:w-1/2">
              <TextAreaInput
                id="resume"
                label="Paste Resume"
                v-model="resume.content"
                placeholder="Paste your resume text here..."
                :error="errors.resume"
                hint="For best results, include your skills, experience, and qualifications"
              />
            </div>
            <div class="md:w-1/2">
              <FileUpload 
                id="resume-file-upload"
                label="Upload Resume"
                accept=".txt,.md,.pdf"
                :error="errors.resumeFile"
                @file-selected="handleResumeFileUpload"
              />
            </div>
          </div>
        </InputContainer>

        <InputContainer 
          ref="settingsContainer"
          title="Analysis Settings"
        >
          <ServiceSelector v-model="selectedService" />
        </InputContainer>

        <div class="mt-8 mb-8 text-center">
          <button 
            @click="validateAndAnalyze"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:bg-blue-300"
            :disabled="isAnalyzing"
          >
            <span v-if="isAnalyzing" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
            <span v-else>Analyze Job Posting</span>
          </button>
        </div>
        
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{{ error }}</p>
        </div>
        
        <AnalysisResults 
          v-if="analysisResults" 
          :results="analysisResults" 
          :job-title="jobPosting.title"
          :analysis-id="currentAnalysisId"
          @clear="clearResults"
          class="analysis-results"
        />
      </div>
      
      <!-- Sidebar - 1/3 width on large screens -->
      <div class="lg:col-span-1">
        <AnalysisHistory 
          :items="savedAnalyses"
          @select="loadSavedAnalysis"
          @delete="deleteSavedAnalysis"
          @clear="clearSavedAnalyses"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import type { JobPosting, Resume, AnalysisResult, SavedAnalysis } from '../types';
import { StorageService } from '../services/StorageService';
import { AnalysisService } from '../services/AnalysisService';

// Import components
import InputContainer from '../components/input/InputContainer.vue';
import TextAreaInput from '../components/input/TextAreaInput.vue';
import FileUpload from '../components/input/FileUpload.vue';
import ServiceSelector from '../components/input/ServiceSelector.vue';
import AnalysisResults from '../components/analysis/AnalysisResults.vue';
import AnalysisHistory from '../components/analysis/AnalysisHistory.vue';

// State
const jobPosting = reactive<JobPosting>({
  title: '',
  content: ''
});

const resume = reactive<Resume>({
  content: ''
});

const errors = reactive({
  jobPosting: '',
  jobPostingFile: '',
  resume: '',
  resumeFile: ''
});

const isAnalyzing = ref(false);
const error = ref('');
const analysisResults = ref<AnalysisResult | null>(null);
const savedAnalyses = ref<SavedAnalysis[]>([]);
const selectedService = ref<'mock' | 'gemini' | 'openai'>('mock');
const isIncompleteAnalysis = ref(false);
const currentAnalysisId = ref<string | undefined>(undefined);

// Add refs for the input containers
const jobPostingContainer = ref(null);
const resumeContainer = ref(null);
const settingsContainer = ref(null);

// Load saved analyses on mount
onMounted(async () => {
  savedAnalyses.value = await StorageService.getAnalyses();
});

// Methods
const handleJobFileUpload = ({ content }: { content: string }) => {
  jobPosting.content = content;
  errors.jobPosting = '';
  errors.jobPostingFile = '';
};

const handleResumeFileUpload = ({ content }: { content: string }) => {
  resume.content = content;
  errors.resume = '';
  errors.resumeFile = '';
};

const validateAndAnalyze = async () => {
  // Reset errors and results
  errors.jobPosting = '';
  errors.resume = '';
  error.value = '';
  let isValid = true;

  // Validate job posting
  if (!jobPosting.content || jobPosting.content.trim().length < 10) {
    errors.jobPosting = 'Please enter a valid job posting with sufficient information';
    isValid = false;
  }

  // Validate resume
  if (!resume.content || resume.content.trim().length < 10) {
    errors.resume = 'Please enter a valid resume with sufficient information';
    isValid = false;
  }

  if (isValid) {
    // Proceed with analysis
    isAnalyzing.value = true;
    try {
      // Check if service is available
      const isAvailable = await AnalysisService.isServiceAvailable(selectedService.value);
      if (!isAvailable) {
        const serviceName = AnalysisService.getServiceName(selectedService.value);
        throw new Error(`${serviceName} is currently unavailable. Please check your API key or try the mock service.`);
      }

      // Call the analysis service
      const results = await AnalysisService.analyzeJobPosting(
        jobPosting,
        resume,
        selectedService.value
      );

      // Save results to storage and update UI
      const savedAnalysis = await StorageService.saveAnalysis(results, jobPosting, resume);
      analysisResults.value = results;
      savedAnalyses.value = await StorageService.getAnalyses();
      currentAnalysisId.value = savedAnalysis.id;  // Store the ID for reference

      // Auto-collapse input sections after results are ready
      collapseInputSections();

      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.querySelector('.analysis-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    } catch (err) {
      console.error('Analysis error:', err);
      error.value = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isAnalyzing.value = false;
    }
  }
};

const clearResults = () => {
  analysisResults.value = null;
  currentAnalysisId.value = undefined;
  // Expand input sections when results are cleared
  expandInputSections();
};

const loadSavedAnalysis = (analysis: SavedAnalysis) => {
  // First, reset all fields
  jobPosting.title = '';
  jobPosting.content = '';
  resume.content = '';

  // Then populate the analysis results
  analysisResults.value = {
    matches: analysis.matches,
    maybes: analysis.maybes || [],
    gaps: analysis.gaps,
    suggestions: analysis.suggestions,
    timestamp: analysis.timestamp
  };

  // Finally, load the job posting and resume if available
  if (analysis.jobPosting) {
    jobPosting.title = analysis.jobPosting.title || '';
    jobPosting.content = analysis.jobPosting.content;
  } else if (analysis.jobTitle) {
    // Fallback for older saved analyses
    jobPosting.title = analysis.jobTitle;
  }

  if (analysis.resume && analysis.resume.content) {
    resume.content = analysis.resume.content;
  }

  // Store the analysis ID
  currentAnalysisId.value = analysis.id;

  // Auto-collapse input sections
  collapseInputSections();

  // Scroll to results
  setTimeout(() => {
    const resultsElement = document.querySelector('.analysis-results');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
};

const deleteSavedAnalysis = async (id: string) => {
  await StorageService.deleteAnalysis(id);
  savedAnalyses.value = await StorageService.getAnalyses();
};

const clearSavedAnalyses = async () => {
  await StorageService.clearAnalyses();
  savedAnalyses.value = [];
};

// Helper functions for collapsing/expanding input sections
const collapseInputSections = () => {
  jobPostingContainer.value?.collapse();
  resumeContainer.value?.collapse();
  settingsContainer.value?.collapse();
};

const expandInputSections = () => {
  jobPostingContainer.value?.expand();
  resumeContainer.value?.expand();
  settingsContainer.value?.expand();
};
</script>
