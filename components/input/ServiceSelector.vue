<template>
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-1">LLM Service</label>
    <div class="flex space-x-2">
      <button v-for="service in availableServices" :key="service.id" @click="selectService(service.id)"
        class="px-3 py-2 rounded-md text-sm font-medium transition-colors" :class="[
          service.id === modelValue
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]">
        {{ service.name }}
      </button>
    </div>
    <p class="mt-1 text-xs text-gray-500">
      <template v-if="modelValue === 'mock'">
        Using mock service (no API calls)
      </template>
      <template v-else-if="modelValue === 'gemini'">
        Using Google Gemini AI
      </template>
      <template v-else>
        Not yet implemented (Coming soon!)
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const availableServices = ref([
  { id: 'gemini', name: 'Google Gemini', enabled: true },
  { id: 'mock', name: 'Mock Service', enabled: true },
  { id: 'openai', name: 'OpenAI', enabled: false },
  { id: 'anthropic', name: 'Anthropic', enabled: false },
  { id: 'cohere', name: 'Cohere', enabled: false },
  { id: 'mistral', name: 'Mistral', enabled: false },
  { id: 'deepseek', name: 'DeepSeek', enabled: false }
]);

const selectService = (serviceId: string) => {
  emit('update:modelValue', serviceId);
};
</script>
