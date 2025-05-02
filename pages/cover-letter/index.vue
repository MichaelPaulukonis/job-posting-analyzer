<template>
  <div class="container mx-auto px-4 py-8">
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
      <h2 class="text-xl font-semibold mb-4">Select an Analysis</h2>
      
      <div v-if="loading" class="text-center py-6">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm rounded-md text-blue-800 bg-blue-100">
          <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading analyses...
        </div>
      </div>
      
      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="analyses.length === 0" class="text-center py-6 text-gray-500">
        <p>No analyses found.</p>
        <NuxtLink to="/analyze" class="text-blue-600 hover:underline mt-2 inline-block">
          Go to the Analysis page to analyze a job posting first
        </NuxtLink>
      </div>
      
      <div v-else>
        <p class="mb-4 text-gray-600">Select an analysis to create a cover letter for:</p>
        <div class="space-y-3">
          <div 
            v-for="analysis in analyses" 
            :key="analysis.id"
            class="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="navigateToAnalysis(analysis.id)"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium">{{ analysis.jobTitle || 'Untitled Job' }}</h3>
                <div class="text-sm text-gray-500 mt-1">
                  {{ new Date(analysis.timestamp).toLocaleString() }}
                </div>
                <div class="mt-2">
                  <span 
                    class="inline-block px-2 py-1 text-xs rounded-full"
                    :class="analysis.coverLetter ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  >
                    {{ analysis.coverLetter ? 'Has Cover Letter' : 'No Cover Letter' }}
                  </span>
                </div>
              </div>
              <span 
                class="inline-block px-2 py-1 rounded-full text-xs font-medium"
                :class="getScoreClass(analysis)"
              >
                {{ calculateMatchScore(analysis) }}% Match
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { SavedAnalysis } from '../../types';
import { StorageService } from '../../services/StorageService';

// State
const loading = ref(true);
const error = ref('');
const analyses = ref<SavedAnalysis[]>([]);

// Load analyses on mount
onMounted(async () => {
  try {
    analyses.value = await StorageService.getAnalyses();
  } catch (err) {
    console.error('Error loading analyses:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load analyses';
  } finally {
    loading.value = false;
  }
});

// Navigate to a specific analysis
const navigateToAnalysis = (id: string) => {
  navigateTo(`/cover-letter/${id}`);
};

// Calculate match score
const calculateMatchScore = (analysis: SavedAnalysis) => {
  const maybeMatchWeight = analysis.maybes?.length ? analysis.maybes.length / 2 : 0;
  const effectiveMatches = analysis.matches.length + maybeMatchWeight;
  const total = analysis.matches.length + analysis.gaps.length + (analysis.maybes?.length || 0);
  
  if (total === 0) return 0;
  return Math.round((effectiveMatches / total) * 100);
};

// Get score color class
const getScoreClass = (analysis: SavedAnalysis) => {
  const score = calculateMatchScore(analysis);
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-blue-100 text-blue-800';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};
</script>
