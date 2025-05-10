<template>
  <div>
    <header class="bg-blue-600 text-white shadow">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold">Job Posting Analyzer</h1>
        <nav class="flex space-x-4 text-white">
          <NuxtLink to="/" class="hover:underline">Home</NuxtLink>
          <NuxtLink :to="currentAnalysisId ? `/analyze/${currentAnalysisId}` : '/analyze'"
            class="hover:underline">Analyze</NuxtLink>
          <NuxtLink :to="currentAnalysisId ? `/cover-letter/${currentAnalysisId}` : '/cover-letter'"
            class="hover:underline">Cover Letters</NuxtLink>
          <NuxtLink to="/login" class="hover:underline">Login</NuxtLink>
          <NuxtLink to="/admin" class="hover:underline">Admin</NuxtLink>
        </nav>
      </div>
    </header>
    <main>
      <slot />
    </main>
    <footer class="bg-gray-100 p-4 mt-8 border-t">
      <div class="container mx-auto text-center text-gray-600">
        <p>© {{ new Date().getFullYear() }} Job Posting Analyzer - Michael Paulukonis</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from '#imports';
import { useRoute } from '#imports';
import { StorageService } from '~/services/StorageService';
import type { LocationQueryValue } from 'vue-router';

const route = useRoute();
const currentAnalysisId = ref<string | undefined>(undefined);

// Watch for route changes to update the current analysis ID
watch(() => route.params.id || route.query.analysisId, async (newId: LocationQueryValue | LocationQueryValue[]) => {
  // If newId is explicitly undefined or empty, clear the current analysis ID
  if (!newId) {
    currentAnalysisId.value = undefined;
    return;
  }

  if (typeof newId === 'string') {
    currentAnalysisId.value = newId;
  } else {
    try {
      // If no ID in route, try to get the most recent analysis
      const analyses = await StorageService.getAnalyses();
      if (analyses.length > 0) {
        currentAnalysisId.value = analyses[0].id;
      } else {
        currentAnalysisId.value = undefined;
      }
    } catch (error) {
      console.warn('Error fetching analyses:', error);
      currentAnalysisId.value = undefined;
    }
  }
}, { immediate: true });
</script>
