<template>
  <div class="mb-6">
    <div class="flex justify-between mb-1">
      <span class="text-sm font-medium text-gray-700">Match Score</span>
      <span class="text-sm font-medium" :class="scoreColorClass">{{ score }}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-4">
      <div 
        class="h-4 rounded-full transition-all duration-500 ease-out"
        :class="scoreColorClass"
        :style="{ width: `${score}%` }"
      ></div>
    </div>
    <div class="mt-2 text-sm text-gray-600">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  matches: number;
  total: number;
}>();

const score = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.matches / props.total) * 100);
});

const scoreColorClass = computed(() => {
  if (score.value >= 80) return 'bg-green-600 text-green-700';
  if (score.value >= 60) return 'bg-blue-600 text-blue-700';
  if (score.value >= 40) return 'bg-yellow-500 text-yellow-700';
  return 'bg-red-500 text-red-700';
});

const message = computed(() => {
  if (score.value >= 80) return 'Excellent match! Your resume aligns very well with this job posting.';
  if (score.value >= 60) return 'Good match. Consider adding a few more relevant skills to your resume.';
  if (score.value >= 40) return 'Moderate match. There are several skills you should add to your resume.';
  if (score.value >= 20) return 'Limited match. Significant updates to your resume are recommended.';
  return 'Poor match. This job may require skills very different from what appears on your resume.';
});
</script>
