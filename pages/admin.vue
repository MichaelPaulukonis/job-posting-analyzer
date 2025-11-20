<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <NuxtLink to="/" class="text-blue-600 hover:underline flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Home
      </NuxtLink>
      <h1 class="text-2xl font-bold">⚙️ Admin Panel</h1>
    </div>

    <!-- Storage Files Section -->
    <div class="bg-white shadow-md rounded-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-xl font-semibold">Storage Files</h2>
          <p class="text-gray-600">View and inspect local storage files used by the application.</p>
        </div>
        <button 
          @click="createSampleFile" 
          class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          :disabled="isCreatingSample"
        >
          {{ isCreatingSample ? 'Creating...' : 'Create Sample File' }}
        </button>
      </div>
      
      <div v-if="isLoading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p class="mt-2 text-gray-600">Loading storage files...</p>
      </div>
      
      <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="storageFiles.length === 0" class="text-center py-8 text-gray-500">
        <p>No storage files found. Click the "Create Sample File" button to generate a test file.</p>
      </div>
      
      <div v-else>
        <StorageFileViewerComponent 
          v-for="fileName in storageFiles" 
          :key="fileName" 
          :fileName="fileName" 
        />
      </div>
    </div>

    <!-- Debug Information -->
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold mb-2">Debug Information</h2>
      <div class="overflow-x-auto">
        <pre class="text-xs">{{ debugInfo }}</pre>
      </div>
    </div>

    <!-- Other Admin Sections (Original Content) -->
    <div class="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Other Admin Features</h2>
      <p class="text-gray-600 mb-4">Additional admin functionality placeholders.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-4 rounded-md">
          <h3 class="font-medium mb-2">User Management</h3>
          <p class="text-gray-500">Placeholder for user management functionality.</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-md">
          <h3 class="font-medium mb-2">System Settings</h3>
          <p class="text-gray-500">Placeholder for system settings.</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-md">
          <h3 class="font-medium mb-2">Analytics</h3>
          <p class="text-gray-500">Placeholder for analytics dashboard.</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-md">
          <h3 class="font-medium mb-2">Content Management</h3>
          <p class="text-gray-500">Placeholder for content management.</p>
        </div>
      </div>
    </div>

    <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
      <p class="font-medium">Note: Admin functionality will be restricted in the future.</p>
      <p class="text-sm mt-1">Currently accessible to all users for development purposes.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
// Explicitly import the component
import StorageFileViewerComponent from '../components/admin/StorageFileViewer.vue';

definePageMeta({
  middleware: ['auth'],
  requiresAuth: true
});

const storageFiles = ref<string[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isCreatingSample = ref(false);
const fetchResponse = ref<any>(null);
const config = useRuntimeConfig();

// Debug information
const debugInfo = computed(() => {
  return {
    appVersion: config.public.appVersion,
    storageFiles: storageFiles.value,
    isLoading: isLoading.value,
    error: error.value,
    fetchResponse: fetchResponse.value,
    appPath: process.cwd?.() || 'Not available',
    timestamp: new Date().toISOString()
  };
});

// Fetch storage files
const fetchStorageFiles = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const { data, error: fetchError } = await useFetch('/api/admin/storage-files');
    fetchResponse.value = { data: data.value, error: fetchError.value };
    
    if (fetchError.value) {
      throw new Error(fetchError.value.message || 'Unknown error occurred');
    }
    
    storageFiles.value = data.value as string[] || [];
  } catch (err) {
    error.value = `Failed to load storage files: ${err instanceof Error ? err.message : String(err)}`;
    console.error('Error loading storage files:', err);
  } finally {
    isLoading.value = false;
  }
};

// Create a sample file
const createSampleFile = async () => {
  if (isCreatingSample.value) return;
  
  isCreatingSample.value = true;
  
  try {
    const { data, error: fetchError } = await useFetch('/api/admin/storage-files/create-sample', { method: 'POST' });
    
    if (fetchError.value) {
      throw new Error(fetchError.value.message || 'Unknown error occurred');
    }
    
    // Refresh the file list
    await fetchStorageFiles();
  } catch (err) {
    console.error('Error creating sample file:', err);
    error.value = `Failed to create sample file: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    isCreatingSample.value = false;
  }
};

onMounted(() => {
  fetchStorageFiles();
});
</script>
