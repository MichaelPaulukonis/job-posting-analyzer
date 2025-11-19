<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <NuxtLink to="/" class="text-blue-600 hover:underline flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Home
      </NuxtLink>
      <h1 class="text-2xl font-bold">🔐 Sign up</h1>
    </div>

    <div class="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
      <h2 class="text-xl font-semibold mb-4">Create account</h2>
      <p class="text-gray-600 mb-4">Create a new account using email and password.</p>

      <div class="space-y-4">
        <label class="block">
          <span class="text-sm">Email</span>
          <input v-model="email" type="email" class="form-input mt-1 block w-full" />
        </label>

        <label class="block">
          <span class="text-sm">Password</span>
          <input v-model="password" type="password" class="form-input mt-1 block w-full" />
        </label>

        <button class="btn" @click="submit">Create account</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { navigateTo } from '#imports';

const email = ref('');
const password = ref('');
const { signUpWithEmail, isAuthenticated } = useAuth();

async function submit() {
  try {
    await signUpWithEmail(email.value, password.value);
    if (isAuthenticated.value) {
      navigateTo('/');
    }
  } catch (err) {
    console.error('Sign up failed', err);
  }
}
</script>
