<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  fileName: string;
}>();

const isLoading = ref(true);
const isExpanded = ref(false);
const fileContent = ref<any>(null);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const { data, error: fetchError } = await useFetch(`/api/admin/storage-files/${props.fileName}`);
    
    if (fetchError.value) {
      throw new Error(fetchError.value.message);
    }
    
    fileContent.value = data.value;
  } catch (err) {
    error.value = `Failed to load file: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    isLoading.value = false;
  }
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const formatJson = (data: any): string => {
  return JSON.stringify(data, null, 2);
};
</script>

<template>
  <div class="border rounded-md mb-4 overflow-hidden">
    <div 
      @click="toggleExpand" 
      class="flex justify-between items-center p-4 bg-gray-100 cursor-pointer hover:bg-gray-200"
    >
      <h3 class="text-lg font-medium">{{ fileName }}</h3>
      <span class="text-gray-600">
        {{ isExpanded ? '▼' : '►' }}
      </span>
    </div>
    
    <div v-if="isExpanded" class="p-4 bg-white">
      <div v-if="isLoading" class="text-center py-4">
        <span class="text-gray-500">Loading...</span>
      </div>
      
      <div v-else-if="error" class="text-red-500 py-2">
        {{ error }}
      </div>
      
      <div v-else-if="fileContent" class="overflow-x-auto">
        <pre class="text-sm whitespace-pre-wrap">{{ formatJson(fileContent) }}</pre>
      </div>
      
      <div v-else class="py-2 text-gray-500">
        No content available
      </div>
    </div>
  </div>
</template>
