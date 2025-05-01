<template>
  <span 
    class="inline-block px-3 py-1 mr-2 mb-2 rounded-full text-sm font-medium transition-colors"
    :class="tagClass"
  >
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  text: string;
  type: 'match' | 'gap' | 'neutral';
}>();

const tagClass = computed(() => {
  switch (props.type) {
    case 'match':
      return 'bg-green-100 text-green-800';
    case 'gap':
      return 'bg-red-100 text-red-800';
    case 'neutral':
    default:
      return 'bg-gray-100 text-gray-800';
  }
});
</script>
