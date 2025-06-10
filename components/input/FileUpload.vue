<template>
  <div class="mb-4">
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <div
      class="w-full p-4 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 cursor-pointer transition-colors"
      :class="{ 'border-red-500': error }"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
      :data-dragging="isDragging"
    >
      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          width="48" 
          height="48"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          ></path>
        </svg>
        <p class="mt-2 text-sm text-gray-600">
          <span class="font-medium text-blue-600 hover:underline">Click to upload</span> or drag and
          drop
        </p>
        <p class="mt-1 text-xs text-gray-500">{{ acceptedFileTypes }}</p>
        <p v-if="selectedFile" class="mt-2 text-sm text-green-600 font-medium">
          Selected: {{ selectedFile.name }}
        </p>
      </div>
    </div>
    <input
      :id="id"
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="accept"
      @change="handleFileSelect"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const pdfjsLibInstance = ref<any>(null); // To store the dynamically imported library

onMounted(async () => {
  if (typeof window !== 'undefined') { // Ensures this runs only on the client
    try {
      const pdfjs = await import('pdfjs-dist');
      // @ts-ignore - pdfjs-dist types might not perfectly match the workerSrc assignment pattern here
      // User confirmed /js/pdf.worker.min.mjs is the correct path for their local worker
      pdfjs.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs'; 
      pdfjsLibInstance.value = pdfjs;
    } catch (error) {
      console.error("Failed to load pdfjs-dist on client:", error);
    }
  }
});

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  accept: {
    type: String,
    default: '.txt,.md,.docx,.pdf',
  },
  error: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['file-selected']);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);

const acceptedFileTypes = computed(() => {
  return `Accepted file types: ${props.accept.split(',').join(', ')}`;
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0];
    processFile(selectedFile.value);
  }
};

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    selectedFile.value = event.dataTransfer.files[0];
    processFile(selectedFile.value);
  }
};

const processFile = async (file: File) => {
  if (file.type === 'application/pdf') {
    if (typeof window !== 'undefined' && pdfjsLibInstance.value) { // Check client-side and if library is loaded
      const arrayBuffer = await file.arrayBuffer();
      try {
        const pdfjs = pdfjsLibInstance.value;
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        emit('file-selected', { file, content: fullText.trim() });
      } catch (err) {
        console.error('Error processing PDF with PDF.js:', err);
        let errorMessage = 'Failed to parse PDF';
        if (err instanceof Error) {
          errorMessage = `Failed to parse PDF: ${err.message}`;
        }
        emit('file-selected', { file, content: '', error: errorMessage });
      }
    } else if (typeof window !== 'undefined' && !pdfjsLibInstance.value) {
      console.error("PDF.js library not loaded yet or not on client.");
      emit('file-selected', { file, content: '', error: 'PDF library not ready. Please try again.' });
    }
    // If not on client, this block is skipped, preventing SSR issues.
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      emit('file-selected', { file, content });
    };
    reader.readAsText(file);
  }
};
</script>

<style scoped>
[data-dragging="true"] {
  @apply border-blue-500 bg-blue-50;
}

svg {
  max-width: 48px;
  max-height: 48px;
  overflow: visible;
}
</style>
