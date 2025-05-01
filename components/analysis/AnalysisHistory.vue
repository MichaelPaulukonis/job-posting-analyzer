<template>
  <div class="bg-white shadow-md rounded-lg p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Analysis History</h2>
      <button 
        v-if="items.length > 0"
        @click="clearHistory" 
        class="text-sm text-red-600 hover:text-red-800"
      >
        Clear All
      </button>
    </div>
    
    <div v-if="items.length === 0" class="text-center py-6 text-gray-500">
      <p>No saved analyses yet.</p>
      <p class="text-sm mt-2">Completed analyses will be saved here automatically.</p>
    </div>
    
    <div v-else>
      <AnalysisHistoryItem 
        v-for="item in items" 
        :key="item.id" 
        :item="item" 
        :is-selected="selectedId === item.id"
        @select="selectItem"
        @delete="deleteItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SavedAnalysis } from '../../types';
import AnalysisHistoryItem from './AnalysisHistoryItem.vue';

const props = defineProps<{
  items: SavedAnalysis[];
}>();

const emit = defineEmits(['select', 'clear', 'delete']);

const selectedId = ref<string | null>(null);

const selectItem = (item: SavedAnalysis) => {
  selectedId.value = item.id;
  emit('select', item);
};

const deleteItem = (id: string) => {
  if (confirm('Are you sure you want to delete this analysis?')) {
    emit('delete', id);
    if (selectedId.value === id) {
      selectedId.value = null;
    }
  }
};

const clearHistory = () => {
  if (confirm('Are you sure you want to clear all saved analyses?')) {
    emit('clear');
    selectedId.value = null;
  }
};
</script>
