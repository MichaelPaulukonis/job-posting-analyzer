<template>
  <div 
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('update:modelValue', false)"></div>

    <!-- Dialog -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div 
        class="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 id="dialog-title" class="text-lg font-semibold text-gray-900">
            Save Resume
          </h3>
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <div class="mb-4">
            <label for="resume-name" class="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
            <input
              id="resume-name"
              v-model="resumeName"
              type="text"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a name for this resume"
              @keyup.enter="handleSave"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('update:modelValue', false)"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            :disabled="!resumeName.trim()"
            @click="handleSave"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', name: string): void;
}>();

const resumeName = ref('');

const handleSave = () => {
  if (resumeName.value.trim()) {
    emit('save', resumeName.value.trim());
    emit('update:modelValue', false);
    resumeName.value = ''; // Reset for next time
  }
};
</script> 