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
        class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 id="dialog-title" class="text-lg font-semibold text-gray-900">
            Save as Sample Cover Letter
          </h3>
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <div class="mb-4">
            <label for="sample-name" class="block text-sm font-medium text-gray-700 mb-1">Sample Name</label>
            <input
              id="sample-name"
              v-model="sampleName"
              type="text"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a name for this sample"
              @keyup.enter="handleSave"
            />
          </div>
          
          <div class="mb-4">
            <label for="sample-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              id="sample-notes"
              v-model="sampleNotes"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              placeholder="Add notes about why this is a good sample (e.g., 'Strong opening paragraph', 'Good technical skills section')"
            ></textarea>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Preview</label>
            <div class="p-4 bg-gray-50 rounded-md max-h-[200px] overflow-y-auto">
              <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ preview }}</p>
            </div>
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
            :disabled="!sampleName.trim()"
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
  preview: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', data: { name: string; notes: string }): void;
}>();

const sampleName = ref('');
const sampleNotes = ref('');

const handleSave = () => {
  if (sampleName.value.trim()) {
    emit('save', {
      name: sampleName.value.trim(),
      notes: sampleNotes.value.trim()
    });
    emit('update:modelValue', false);
    // Reset for next time
    sampleName.value = '';
    sampleNotes.value = '';
  }
};
</script> 