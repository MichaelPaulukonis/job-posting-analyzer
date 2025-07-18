<template>
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-1">Select Resume</label>
    <div class="flex flex-col gap-2">
      <div v-for="savedResume in resumes" :key="savedResume.id"
        class="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
        :class="{ 'border-blue-300 bg-blue-50': selectedResumeId === savedResume.id }"
        @click="selectResume(savedResume)">
        <div class="flex-1">
          <div class="font-medium">{{ savedResume.name }}</div>
          <div class="text-xs text-gray-500">
            {{ new Date(savedResume.timestamp).toLocaleString() }}
          </div>
        </div>
        <button @click.stop="deleteResume(savedResume.id)"
          class="text-gray-400 hover:text-red-500 p-1"
          name="Delete this resume">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <div v-if="resumes.length === 0" class="text-sm text-gray-500 text-center py-2">
        No saved resumes found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ResumeEntry } from '../../types';

const props = defineProps<{
  modelValue: string | null;
  resumes: ResumeEntry[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
  (e: 'select', resume: ResumeEntry): void;
  (e: 'delete', id: string): void;
}>();

const selectedResumeId = ref<string | null>(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  selectedResumeId.value = newValue;
});

const selectResume = (resume: ResumeEntry) => {
  selectedResumeId.value = resume.id;
  emit('update:modelValue', resume.id);
  emit('select', resume);
};

const deleteResume = (id: string) => {
  emit('delete', id);
};
</script> 