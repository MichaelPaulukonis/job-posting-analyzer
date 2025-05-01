<template>
  <div 
    class="border border-gray-200 rounded-md p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer"
    :class="{ 'border-blue-300 bg-blue-50': isSelected }"
    @click="$emit('select', item)"
  >
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-medium">{{ item.jobTitle || 'Untitled Job' }}</h3>
        <div class="text-sm text-gray-500 mt-1">
          {{ new Date(item.timestamp).toLocaleString() }}
        </div>
      </div>
      <div class="flex items-center">
        <span 
          class="inline-block px-2 py-1 rounded-full text-xs font-medium"
          :class="scoreClass"
        >
          {{ matchScore }}% Match
        </span>
        <button 
          @click.stop="$emit('delete', item.id)" 
          class="ml-2 text-gray-400 hover:text-red-500"
          title="Delete this analysis"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SavedAnalysis } from '../../types';

const props = defineProps<{
  item: SavedAnalysis;
  isSelected: boolean;
}>();

defineEmits(['select', 'delete']);

const matchScore = computed(() => {
  const total = props.item.matches.length + props.item.gaps.length;
  if (total === 0) return 0;
  return Math.round((props.item.matches.length / total) * 100);
});

const scoreClass = computed(() => {
  if (matchScore.value >= 80) return 'bg-green-100 text-green-800';
  if (matchScore.value >= 60) return 'bg-blue-100 text-blue-800';
  if (matchScore.value >= 40) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
});
</script>
