<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">🔍 Analyze Job Posting</h1>
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
        <InputContainer ref="jobPostingContainer" title="Job Posting"
          :summary="jobPosting.title ? `Job Title: ${jobPosting.title}` : 'Job posting content'">
          <div class="mb-4">
            <label for="job-title" class="block text-sm font-medium text-gray-700 mb-1">Job Title (Optional)</label>
            <input id="job-title" v-model="jobPosting.title" type="text"
              placeholder="Job title is used to label history"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div class="flex flex-col md:flex-row gap-4 mb-4">
            <div class="md:w-1/2">
              <TextAreaInput id="job-posting" label="Paste Job Description" v-model="jobPosting.content"
                placeholder="Paste the job posting text here..." :error="errors.jobPosting"
                hint="Paste the full job description including requirements and qualifications" 
                required @blur="validateField('jobPosting')" />
            </div>
            <div class="md:w-1/2">
              <FileUpload id="job-file-upload" label="Upload Job Posting" accept=".txt,.md"
                :error="errors.jobPostingFile" @file-selected="handleJobFileUpload" />
            </div>
          </div>
        </InputContainer>

        <InputContainer ref="resumeContainer" title="Your Resume" summary="Resume content">
          <div class="flex flex-col gap-4">
            <ResumeSelector v-model="selectedResumeId" @select="handleResumeSelect" />
            <div class="flex flex-col md:flex-row gap-4">
              <div class="md:w-1/2">
                <TextAreaInput id="resume" label="Paste Resume" v-model="resume.content"
                  placeholder="Paste your resume text here..." :error="errors.resume"
                  hint="For best results, include your skills, experience, and qualifications" 
                  required @blur="validateField('resume')" />
              </div>
              <div class="md:w-1/2">
                <FileUpload id="resume-file-upload" label="Upload Resume" accept=".txt,.md,.pdf"
                  :error="errors.resumeFile" @file-selected="handleResumeFileUpload" />
              </div>
            </div>
            <div class="flex justify-end">
              <button @click="saveResume"
                class="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-4 rounded-md transition-colors"
                :disabled="!resume.content || resume.content.trim().length < 10"
                title="Save current resume">
                <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Resume
                </span>
              </button>
            </div>
          </div>
        </InputContainer>

        <InputContainer ref="settingsContainer" title="Analysis Settings">
          <ServiceSelector v-model="selectedService" />
        </InputContainer>

        <div class="mt-8 mb-8 text-center">
          <button @click="validateAndAnalyze"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:bg-blue-300"
            :disabled="isAnalyzing">
            <span v-if="isAnalyzing" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              Analyzing...
            </span>
            <span v-else>Analyze Job Posting</span>
          </button>
        </div>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{{ error }}</p>
        </div>

        <AnalysisResults v-if="analysisResults" :results="analysisResults" :job-title="jobPosting.title"
          :analysis-id="currentAnalysisId" @clear="clearResults" class="analysis-results" />
      </div>

      <!-- Sidebar - 1/3 width on large screens -->
      <div class="lg:col-span-1">
        <AnalysisHistory :items="savedAnalyses" @select="loadSavedAnalysis" @delete="deleteSavedAnalysis"
          @clear="clearSavedAnalyses" />
      </div>
    </div>

    <!-- Resume Name Dialog -->
    <ResumeNameDialog
      v-model="showResumeNameDialog"
      @save="handleResumeNameSave"
    />
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
import ResumeSelector from '../components/input/ResumeSelector.vue';
import ResumeNameDialog from '../components/input/ResumeNameDialog.vue';

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
const selectedService = ref<'mock' | 'gemini' | 'openai'>('gemini');
const isIncompleteAnalysis = ref(false);
const currentAnalysisId = ref<string | undefined>(undefined);
const selectedResumeId = ref('');
const showResumeNameDialog = ref(false);

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

const handleResumeSelect = (selectedResume: { content: string }) => {
  resume.content = selectedResume.content;
  errors.resume = '';
};

const saveResume = async () => {
  if (!resume.content || resume.content.trim().length < 10) {
    errors.resume = 'Please enter a valid resume with sufficient information';
    return;
  }

  showResumeNameDialog.value = true;
};

const handleResumeNameSave = async (name: string) => {
  try {
    await StorageService.saveResume(resume, name);
    // Refresh the resume selector
    const resumeSelector = document.querySelector('resume-selector');
    if (resumeSelector) {
      (resumeSelector as any).refresh();
    }
  } catch (err) {
    console.error('Error saving resume:', err);
    error.value = err instanceof Error ? err.message : 'Failed to save resume';
  }
};

const validateField = (field: 'jobPosting' | 'resume') => {
  if (field === 'jobPosting') {
    if (!jobPosting.content || jobPosting.content.trim().length < 10) {
      errors.jobPosting = 'Please enter a valid job posting with sufficient information';
    } else {
      errors.jobPosting = '';
    }
  } else if (field === 'resume') {
    if (!resume.content || resume.content.trim().length < 10) {
      errors.resume = 'Please enter a valid resume with sufficient information';
    } else {
      errors.resume = '';
    }
  }
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

const clearFormFields = () => {
  // Clear job posting data
  jobPosting.title = '';
  jobPosting.content = '';
  
  // Clear resume data
  resume.content = '';
  
  // Reset error messages
  errors.jobPosting = '';
  errors.jobPostingFile = '';
  errors.resume = '';
  errors.resumeFile = '';
  error.value = '';
  
  // Expand all input sections in case they were collapsed
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

// Add watchers for real-time validation
watch(() => jobPosting.content, (newContent) => {
  if (newContent && newContent.trim().length >= 10) {
    errors.jobPosting = '';
  }
});

watch(() => resume.content, (newContent) => {
  if (newContent && newContent.trim().length >= 10) {
    errors.resume = '';
  }
});
</script>
