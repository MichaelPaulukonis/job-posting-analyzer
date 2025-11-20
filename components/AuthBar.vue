<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from '#imports';
import { useAuth } from '~/composables/useAuth';

const route = useRoute();
const router = useRouter();
const { user, isAuthenticated, authReady, actionPending, signOut } = useAuth();

const isMenuOpen = ref(false);

const displayName = computed(() => user.value?.displayName || user.value?.email || 'Account');

const currentRoutePath = computed(() => route.fullPath || '/');

const navigateToLogin = () => {
  router.push({
    path: '/login',
    query: { redirect: currentRoutePath.value }
  });
};

const handleSignOut = async () => {
  if (actionPending.value) return;
  try {
    await signOut();
    isMenuOpen.value = false;
    await router.push('/login');
  } catch (error) {
    console.error('Sign out failed', error);
  }
};

watch(() => route.fullPath, () => {
  isMenuOpen.value = false;
});
</script>

<template>
  <div class="relative flex items-center">
    <span v-if="!authReady" class="text-xs uppercase tracking-wide text-white/80">Checking auth…</span>
    <button
      v-else-if="isAuthenticated"
      class="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/25"
      type="button"
      @click="isMenuOpen = !isMenuOpen"
      aria-haspopup="true"
      :aria-expanded="isMenuOpen"
    >
      <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/30 text-xs font-semibold uppercase">
        {{ displayName.charAt(0) }}
      </span>
      <span class="max-w-[8rem] truncate">{{ displayName }}</span>
      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <button
      v-else
      class="rounded-full border border-white/40 px-4 py-1 text-sm font-semibold text-white transition hover:bg-white/10"
      type="button"
      @click="navigateToLogin"
    >
      Sign in
    </button>

    <div
      v-if="isAuthenticated && isMenuOpen"
      class="absolute right-0 top-10 w-48 rounded-md bg-white py-2 text-sm text-gray-800 shadow-lg"
      role="menu"
    >
      <NuxtLink
        to="/admin"
        class="block px-4 py-2 hover:bg-gray-100"
        role="menuitem"
      >
        Admin
      </NuxtLink>
      <button
        class="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
        type="button"
        :disabled="actionPending"
        @click="handleSignOut"
      >
        {{ actionPending ? 'Signing out…' : 'Sign out' }}
      </button>
    </div>
  </div>
</template>
