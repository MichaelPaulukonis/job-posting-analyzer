// ...existing code...
<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">🔍 Analyze Job Posting</h1>
      <button @click="clearFormFields"
        class="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-4 rounded-md transition-colors"
        title="Clear all form fields">
        <span class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                hint="Paste the full job description including requirements and qualifications" required
                @blur="validateField('jobPosting')" />
            </div>
            <div class="md:w-1/2">
              <FileUpload id="job-file-upload" label="Upload Job Posting" accept=".txt,.md"
                :error="errors.jobPostingFile" @file-selected="handleJobFileUpload" />
            </div>
          </div>
        </InputContainer>

        <InputContainer ref="resumeContainer" title="Your Resume" summary="Resume content">
          <div class="flex flex-col gap-4">
            <ResumeSelector 
              v-model="selectedResumeId" 
              :resumes="savedResumes"
              @select="handleResumeSelect" 
              @delete="deleteResume" 
            />
            <div class="flex flex-col md:flex-row gap-4">
              <div class="md:w-1/2">
                <TextAreaInput id="resume" label="Paste Resume" v-model="resume.content"
                  placeholder="Paste your resume text here..." :error="errors.resume"
                  hint="For best results, include your skills, experience, and qualifications" required
                  @blur="validateField('resume')" />
              </div>
              <div class="md:w-1/2">
                <FileUpload id="resume-file-upload" label="Upload Resume" accept=".txt,.md,.pdf"
                  :error="errors.resumeFile" @file-selected="handleResumeFileUpload" />
              </div>
            </div>
            <div class="flex justify-end">
              <button @click="saveResume"
                class="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-4 rounded-md transition-colors"
                :disabled="!resume.content || resume.content.trim().length < 10" title="Save current resume">
                <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
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
        <AnalysisHistory :items="savedAnalyses" @select="loadSavedAnalysis" @delete="deleteSavedAnalysis" />
      </div>
    </div>

    <!-- Resume Name Dialog -->
    <ResumeNameDialog v-model="showResumeNameDialog" @save="handleResumeNameSave" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAnalysis } from '../composables/useAnalysis';

definePageMeta({
  middleware: ['auth'],
  requiresAuth: true
});

// Import components
import InputContainer from '../components/input/InputContainer.vue';
import TextAreaInput from '../components/input/TextAreaInput.vue';
import FileUpload from '../components/input/FileUpload.vue';
import ServiceSelector from '../components/input/ServiceSelector.vue';
import AnalysisResults from '../components/analysis/AnalysisResults.vue';
import AnalysisHistory from '../components/analysis/AnalysisHistory.vue';
import ResumeSelector from '../components/input/ResumeSelector.vue';
import ResumeNameDialog from '../components/input/ResumeNameDialog.vue';

// Use the analysis composable
const {
  jobPosting,
  resume,
  errors,
  isAnalyzing,
  error,
  analysisResults,
  savedAnalyses,
  savedResumes,
  selectedService,
  currentAnalysisId,
  selectedResumeId,
  showResumeNameDialog,
  jobPostingContainer,
  resumeContainer,
  settingsContainer,
  handleJobFileUpload,
  handleResumeFileUpload,
  handleResumeSelect,
  saveResume,
  handleResumeNameSave,
  deleteResume,
  validateField,
  validateAndAnalyze,
  clearResults,
  clearFormFields,
  loadSavedAnalysis,
  deleteSavedAnalysis,
  loadAnalyses,
  getAnalysisId
} = useAnalysis();

const route = useRoute();
const router = useRouter();

// Load saved analyses on mount and when route changes
onMounted(() => {
  loadAnalyses();
});

// Watch for route changes
watch(() => [route.params.id, route.query.analysisId], () => {
  loadAnalyses();
});
</script>
