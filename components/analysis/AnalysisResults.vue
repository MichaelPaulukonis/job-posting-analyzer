<template>
  <div class="bg-white shadow-md rounded-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-semibold">Analysis Results</h2>
      <div class="flex space-x-2">
        <button 
          @click="showExportOptions = !showExportOptions" 
          class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
        >
          <span>Export</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <button 
          @click="$emit('clear')" 
          class="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50"
        >
          Clear Results
        </button>
      </div>
    </div>
    
    <!-- Export options dropdown -->
    <div v-if="showExportOptions" class="relative mb-4">
      <div class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
        <div class="py-1">
          <a href="#" @click.prevent="exportResults('txt')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Export as Text (.txt)
          </a>
          <a href="#" @click.prevent="exportResults('json')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Export as JSON
          </a>
          <a href="#" @click.prevent="exportResults('html')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Export as HTML
          </a>
        </div>
      </div>
    </div>
    
    <!-- Job title information -->
    <div v-if="jobTitle" class="mb-6 p-4 bg-gray-50 rounded-md">
      <h3 class="font-semibold mb-2">Analyzed Job: {{ jobTitle }}</h3>
    </div>
    
    <!-- Match score indicator -->
    <SkillMatchIndicator 
      :matches="results.matches.length" 
      :total="results.matches.length + results.gaps.length" 
    />
    
    <!-- Skills visualization -->
    <div class="mb-6">
      <h3 class="font-semibold mb-3">Skills Overview</h3>
      <div>
        <KeywordTag 
          v-for="match in results.matches" 
          :key="`tag-match-${match}`" 
          :text="match" 
          type="match" 
        />
        <KeywordTag 
          v-for="gap in results.gaps" 
          :key="`tag-gap-${gap}`" 
          :text="gap" 
          type="gap" 
        />
      </div>
    </div>
    
    <!-- Detailed sections (collapsible) -->
    <div class="mb-6">
      <div 
        @click="toggleSection('matches')" 
        class="flex justify-between items-center p-4 bg-blue-50 rounded-t-md cursor-pointer"
        :class="{ 'rounded-b-md': !sectionsOpen.matches }"
      >
        <h3 class="font-semibold text-blue-800">Matching Skills & Qualifications</h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 text-blue-800 transition-transform" 
          :class="{ 'transform rotate-180': sectionsOpen.matches }"
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
      <div v-if="sectionsOpen.matches" class="p-4 border border-blue-100 rounded-b-md">
        <ul v-if="results.matches.length" class="list-disc pl-5 space-y-1">
          <li v-for="(match, index) in results.matches" :key="`match-${index}`" class="text-blue-700">
            {{ match }}
          </li>
        </ul>
        <p v-else class="text-gray-600 italic">No matches found.</p>
      </div>
    </div>

    <div class="mb-6">
      <div 
        @click="toggleSection('matches')" 
        class="flex justify-between items-center p-4 bg-blue-50 rounded-t-md cursor-pointer"
        :class="{ 'rounded-b-md': !sectionsOpen.maybes }"
      >
        <h3 class="font-semibold text-blue-800">Semi Matching Skills & Qualifications</h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 text-blue-800 transition-transform" 
          :class="{ 'transform rotate-180': sectionsOpen.matches }"
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
      <div v-if="sectionsOpen.matches" class="p-4 border border-blue-100 rounded-b-md">
        <ul v-if="results.matches.length" class="list-disc pl-5 space-y-1">
          <li v-for="(maybe, index) in results.maybes" :key="`match-${index}`" class="text-blue-700">
            {{ maybe }}
          </li>
        </ul>
        <p v-else class="text-gray-600 italic">No maybes found.</p>
      </div>
    </div>
    
    <div class="mb-6">
      <div 
        @click="toggleSection('gaps')" 
        class="flex justify-between items-center p-4 bg-red-50 rounded-t-md cursor-pointer"
        :class="{ 'rounded-b-md': !sectionsOpen.gaps }"
      >
        <h3 class="font-semibold text-red-800">Missing Skills & Qualifications</h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 text-red-800 transition-transform" 
          :class="{ 'transform rotate-180': sectionsOpen.gaps }"
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
      <div v-if="sectionsOpen.gaps" class="p-4 border border-red-100 rounded-b-md">
        <ul v-if="results.gaps.length" class="list-disc pl-5 space-y-1">
          <li v-for="(gap, index) in results.gaps" :key="`gap-${index}`" class="text-red-700">
            {{ gap }}
          </li>
        </ul>
        <p v-else class="text-gray-600 italic">No gaps found! Your resume covers all requirements.</p>
      </div>
    </div>
    
    <div>
      <div 
        @click="toggleSection('suggestions')" 
        class="flex justify-between items-center p-4 bg-green-50 rounded-t-md cursor-pointer"
        :class="{ 'rounded-b-md': !sectionsOpen.suggestions }"
      >
        <h3 class="font-semibold text-green-800">Suggestions for Improvement</h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 text-green-800 transition-transform" 
          :class="{ 'transform rotate-180': sectionsOpen.suggestions }"
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
      <div v-if="sectionsOpen.suggestions" class="p-4 border border-green-100 rounded-b-md">
        <ul v-if="results.suggestions.length" class="list-disc pl-5 space-y-1">
          <li v-for="(suggestion, index) in results.suggestions" :key="`suggestion-${index}`" class="text-green-700">
            {{ suggestion }}
          </li>
        </ul>
        <p v-else class="text-gray-600 italic">No suggestions available.</p>
      </div>
    </div>
    
    <div class="mt-4 text-xs text-gray-500 text-right">
      Analyzed on: {{ new Date(results.timestamp).toLocaleString() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { AnalysisResult } from '../../types';
import SkillMatchIndicator from './SkillMatchIndicator.vue';
import KeywordTag from './KeywordTag.vue';

const props = defineProps<{
  results: AnalysisResult;
  jobTitle?: string;
}>();

defineEmits(['clear']);

const showExportOptions = ref(false);
const sectionsOpen = reactive({
  matches: true,
  maybes: true,
  gaps: true,
  suggestions: true
});

const toggleSection = (section: 'matches' | 'gaps' | 'suggestions') => {
  sectionsOpen[section] = !sectionsOpen[section];
};

const exportResults = (format: 'txt' | 'json' | 'html') => {
  showExportOptions.value = false;
  
  let content = '';
  let mimeType = '';
  let extension = '';
  
  if (format === 'txt') {
    content = createTextContent();
    mimeType = 'text/plain';
    extension = 'txt';
  } else if (format === 'json') {
    content = JSON.stringify(props.results, null, 2);
    mimeType = 'application/json';
    extension = 'json';
  } else if (format === 'html') {
    content = createHtmlContent();
    mimeType = 'text/html';
    extension = 'html';
  }
  
  // Create a download link
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-analysis-${new Date().toISOString().split('T')[0]}.${extension}`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

const createTextContent = () => {
  return `
JOB POSTING ANALYSIS RESULTS
Generated on: ${new Date(props.results.timestamp).toLocaleString()}
${props.jobTitle ? `Job Title: ${props.jobTitle}` : ''}

MATCH SCORE:
${calculateMatchScore()}%

MATCHING SKILLS & QUALIFICATIONS:
${props.results.matches.length ? props.results.matches.map(m => `- ${m}`).join('\n') : 'None found'}

POSSIBLY SKILLS & QUALIFICATIONS (think about revising):
${props.results.maybes.length ? props.results.maybes.map(m => `- ${m}`).join('\n') : 'None found'}

MISSING SKILLS & QUALIFICATIONS:
${props.results.gaps.length ? props.results.gaps.map(g => `- ${g}`).join('\n') : 'None found'}

SUGGESTIONS FOR IMPROVEMENT:
${props.results.suggestions.length ? props.results.suggestions.map(s => `- ${s}`).join('\n') : 'None provided'}
  `.trim();
  // TODO: include the job description and resume content
};

const createHtmlContent = () => {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Job Analysis Results</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2 { color: #2c5282; }
    .timestamp { color: #718096; font-size: 0.8rem; margin-top: 30px; text-align: right; }
    .score-container { margin: 20px 0; }
    .score-bar { background-color: #edf2f7; border-radius: 9999px; height: 20px; overflow: hidden; }
    .score-fill { height: 100%; }
    .match { color: #2f855a; }
    .maube { color: #2b6cb0; }
    .gap { color: #c53030; }
    .match-tag { background-color: #c6f6d5; color: #2f855a; display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 9999px; }
    .maybe-tag { background-color: #bee3f8; color: #2b6cb0; display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 9999px; }
    .gap-tag { background-color: #fed7d7; color: #c53030; display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 9999px; }
    .section { margin: 20px 0; padding: 15px; border-radius: 5px; }
    .matches-section { background-color: #ebf8ff; }
    .gaps-section { background-color: #fff5f5; }
    .suggestions-section { background-color: #f0fff4; }
  </style>
</head>
<body>
  <h1>Job Posting Analysis Results</h1>
  ${props.jobTitle ? `<h2>Job Title: ${props.jobTitle}</h2>` : ''}
  
  <div class="score-container">
    <h3>Match Score: ${calculateMatchScore()}%</h3>
    <div class="score-bar">
      <div class="score-fill" style="width: ${calculateMatchScore()}%; background-color: ${getScoreColor()}"></div>
    </div>
  </div>
  
  <div>
    <h3>Skills Overview:</h3>
    ${props.results.matches.map(match => `<span class="match-tag">${match}</span>`).join(' ')}
    ${props.results.gaps.map(gap => `<span class="gap-tag">${gap}</span>`).join(' ')}
  </div>
  
  <div class="section matches-section">
    <h3>Matching Skills & Qualifications</h3>
    ${props.results.matches.length 
      ? `<ul>${props.results.matches.map(match => `<li class="match">${match}</li>`).join('')}</ul>` 
      : '<p><em>No matches found.</em></p>'}
  </div>

  <div class="section maybes-section">
    <h3>Semi Matching Skills & Qualifications</h3>
    ${props.results.maybes.length 
      ? `<ul>${props.results.maybes.map(maybe => `<li class="maybe">${maybe}</li>`).join('')}</ul>` 
      : '<p><em>No maybes found.</em></p>'}
  </div>
  
  <div class="section gaps-section">
    <h3>Missing Skills & Qualifications</h3>
    ${props.results.gaps.length 
      ? `<ul>${props.results.gaps.map(gap => `<li class="gap">${gap}</li>`).join('')}</ul>` 
      : '<p><em>No gaps found! Your resume covers all requirements.</em></p>'}
  </div>
  
  <div class="section suggestions-section">
    <h3>Suggestions for Improvement</h3>
    ${props.results.suggestions.length 
      ? `<ul>${props.results.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}</ul>` 
      : '<p><em>No suggestions available.</em></p>'}
  </div>
  
  <div class="timestamp">
    Generated on: ${new Date(props.results.timestamp).toLocaleString()}
  </div>
</body>
</html>
  `.trim();
};

const calculateMatchScore = () => {
  // Count each maybe as half a match
  const maybeMatchWeight = props.results.maybes?.length ? props.results.maybes.length / 2 : 0;
  
  // Add weighted maybes to direct matches for the numerator
  const effectiveMatches = props.results.matches.length + maybeMatchWeight;
  
  // Total skills required (for denominator)
  const total = props.results.matches.length + props.results.gaps.length + (props.results.maybes?.length || 0);
  
  if (total === 0) return 0;
  
  return Math.round((effectiveMatches / total) * 100);
};

const getScoreColor = () => {
  const score = calculateMatchScore();
  if (score >= 80) return '#48bb78'; // green
  if (score >= 60) return '#4299e1'; // blue
  if (score >= 40) return '#ecc94b'; // yellow
  return '#f56565'; // red
};
</script>


<style scoped>
svg {
  max-width: 48px;
  max-height: 48px;
  overflow: visible;
}
</style>