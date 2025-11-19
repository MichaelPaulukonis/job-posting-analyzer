<script setup lang="ts">
import { useAuth } from '~/composables/useAuth';

const { user, isAuthenticated, signOut } = useAuth();
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-if="isAuthenticated">
      <span>{{ user?.email }}</span>
      <button @click="signOut" class="btn">Sign out</button>
    </div>
    <div v-else>
      <NuxtLink to="/login" class="btn">Sign in</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.btn { padding: 0.25rem 0.5rem; }
</style>
