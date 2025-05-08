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

    <div class="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Admin Dashboard</h2>
      <p class="text-gray-600 mb-4">This is a placeholder for the admin functionality.</p>
      
      <!-- Placeholder content - to be implemented later -->
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
// Placeholder for future admin functionality
</script>
