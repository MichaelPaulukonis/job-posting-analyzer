<template>
  <div class="bg-white shadow-md rounded-lg p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Analysis History</h2>
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
        @delete="showDeleteConfirmation(item.id)"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Delete Analysis"
      message="Are you sure you want to delete this analysis? This action cannot be undone."
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="handleDeleteConfirm"
    />

    <!-- Clear All Confirmation Dialog -->
    <ConfirmDialog
      v-model="showClearDialog"
      title="Clear All Analyses"
      message="Are you sure you want to clear all saved analyses? This action cannot be undone."
      confirm-text="Clear All"
      cancel-text="Cancel"
      @confirm="handleClearConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SavedAnalysis } from '../../types';
import AnalysisHistoryItem from './AnalysisHistoryItem.vue';
import ConfirmDialog from '../common/ConfirmDialog.vue';

const props = defineProps<{
  items: SavedAnalysis[];
}>();

const emit = defineEmits(['select', 'clear', 'delete']);

const selectedId = ref<string | null>(null);
const showDeleteDialog = ref(false);
const showClearDialog = ref(false);
const itemToDelete = ref<string | null>(null);

const selectItem = (item: SavedAnalysis) => {
  selectedId.value = item.id;
  emit('select', item);
};

const showDeleteConfirmation = (id: string) => {
  itemToDelete.value = id;
  showDeleteDialog.value = true;
};

const handleDeleteConfirm = () => {
  if (itemToDelete.value) {
    emit('delete', itemToDelete.value);
    if (selectedId.value === itemToDelete.value) {
      selectedId.value = null;
    }
    itemToDelete.value = null;
  }
};

const handleClearConfirm = () => {
  emit('clear');
  selectedId.value = null;
};
</script>
