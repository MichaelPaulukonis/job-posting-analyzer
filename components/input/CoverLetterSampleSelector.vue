<template>
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-1">Select Sample Cover Letter</label>
    <div class="flex flex-col gap-2">
      <div v-for="sample in savedSamples" :key="sample.id"
        class="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
        :class="{ 'border-blue-300 bg-blue-50': selectedSampleId === sample.id }"
        @click="selectSample(sample)">
        <div class="flex-1">
          <div class="font-medium">{{ sample.name }}</div>
          <div v-if="sample.notes" class="text-sm text-gray-600 mt-1">
            {{ sample.notes }}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ new Date(sample.timestamp).toLocaleString() }}
          </div>
        </div>
        <button @click.stop="deleteSample(sample.id)"
          class="text-gray-400 hover:text-red-500 p-1"
          title="Delete this sample">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <div v-if="savedSamples.length === 0" class="text-sm text-gray-500 text-center py-2">
        No saved samples found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { StorageService } from '../../services/StorageService';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'select', sample: { content: string }): void;
}>();

const savedSamples = ref<Array<{ id: string; name: string; content: string; notes: string; timestamp: string }>>([]);
const selectedSampleId = ref<string>(props.modelValue);

// Load saved samples on mount
onMounted(async () => {
  const samples = await StorageService.getCoverLetterSamples();
  savedSamples.value = Array.isArray(samples) ? samples : [];
});

const selectSample = (sample: { id: string; content: string }) => {
  selectedSampleId.value = sample.id;
  emit('update:modelValue', sample.id);
  emit('select', { content: sample.content });
};

const deleteSample = async (id: string) => {
  await StorageService.deleteCoverLetterSample(id);
  const samples = await StorageService.getCoverLetterSamples();
  savedSamples.value = Array.isArray(samples) ? samples : [];
  if (selectedSampleId.value === id) {
    selectedSampleId.value = '';
    emit('update:modelValue', '');
  }
};
</script> 