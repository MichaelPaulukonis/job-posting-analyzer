<template>
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-1">LLM Service</label>
    <div class="flex space-x-2">
      <button v-for="service in availableServices" :key="service.id" @click="selectService(service.id)"
        :disabled="!service.enabled"
        class="px-3 py-2 rounded-md text-sm font-medium transition-colors" :class="[
          service.id === modelValue
            ? 'bg-blue-600 text-white'
            : service.enabled 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
        ]">
        {{ service.name }}
      </button>
    </div>
    <p class="mt-1 text-xs text-gray-500">
      <template v-if="currentService">
        <template v-if="currentService.id === 'mock'">
          Using mock service (no API calls)
        </template>
        <template v-else>
          Using {{ currentService.name }} AI
        </template>
      </template>
      <template v-else>
        No service selected
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

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
  { id: 'anthropic', name: 'Anthropic', enabled: true },
  { id: 'cohere', name: 'Cohere', enabled: false },
  { id: 'mistral', name: 'Mistral', enabled: false },
  { id: 'deepseek', name: 'DeepSeek', enabled: false }
]);

const currentService = computed(() => {
  return availableServices.value.find(service => service.id === props.modelValue);
});

const selectService = (serviceId: string) => {
  const service = availableServices.value.find(s => s.id === serviceId);
  if (service && service.enabled) {
    emit('update:modelValue', serviceId);
  }
};
</script>
