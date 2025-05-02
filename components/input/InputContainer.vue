<template>
  <div class="bg-white shadow-md rounded-lg p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">{{ title }}</h2>
      <button 
        @click="toggleCollapse" 
        class="text-gray-500 hover:text-gray-700 focus:outline-none"
        :aria-label="isCollapsed ? 'Expand' : 'Collapse'"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 transition-transform"
          :class="{ 'transform rotate-180': !isCollapsed }"
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <div v-show="!isCollapsed" class="transition-all duration-300">
      <slot></slot>
    </div>
    <div v-if="isCollapsed" class="text-sm text-gray-500 italic">
      {{ summary || `${title} content (click to expand)` }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    default: '',
  },
  collapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['collapse-change']);

const isCollapsed = ref(props.collapsed);

watch(() => props.collapsed, (newValue) => {
  isCollapsed.value = newValue;
});

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('collapse-change', isCollapsed.value);
};

// Expose collapse method for parent components
defineExpose({
  collapse: () => { isCollapsed.value = true; },
  expand: () => { isCollapsed.value = false; }
});
</script>
