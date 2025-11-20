<template>
  <div class="container mx-auto px-4 py-12">
    <div class="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-lg">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Create your account</h1>
        <NuxtLink to="/" class="text-sm font-medium text-blue-600 hover:text-blue-500">Back home</NuxtLink>
      </div>

      <p class="mb-6 text-sm text-gray-500">
        Accounts are powered by Firebase Authentication. Use a strong password and keep it safe—this account unlocks resume history and admin tooling in the analyzer.
      </p>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <div>
          <label for="email" class="text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            autocomplete="email"
          />
          <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
        </div>

        <div>
          <label for="password" class="text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="8"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            autocomplete="new-password"
          />
          <p v-if="errors.password" class="mt-2 text-sm text-red-600">{{ errors.password }}</p>
        </div>

        <div>
          <label for="confirmPassword" class="text-sm font-medium text-gray-700">Confirm password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            required
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            autocomplete="new-password"
          />
          <p v-if="errors.confirmPassword" class="mt-2 text-sm text-red-600">{{ errors.confirmPassword }}</p>
        </div>

        <div class="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          Passwords must be at least 8 characters. Consider using a passphrase or password manager for best security.
        </div>

        <div v-if="submitError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ submitError }}
        </div>

        <button
          type="submit"
          class="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          :disabled="isSubmitting"
        >
          <svg v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ isSubmitting ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <div class="my-8 flex items-center">
        <span class="h-px flex-1 bg-gray-200"></span>
        <span class="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">or</span>
        <span class="h-px flex-1 bg-gray-200"></span>
      </div>

      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        :disabled="actionPending"
        @click="handleGoogleSignIn"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="h-5 w-5" />
        {{ actionPending ? 'Starting Google sign-up…' : 'Continue with Google' }}
      </button>

      <p class="mt-8 text-center text-sm text-gray-500">
        Already have an account?
        <NuxtLink :to="{ path: '/login', query: { redirect: redirectTarget } }" class="font-semibold text-blue-600 hover:text-blue-500">
          Sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from '#imports';
import { useAuth } from '~/composables/useAuth';

definePageMeta({
  middleware: ['auth'],
  requiresGuest: true
});

const route = useRoute();
const router = useRouter();
const { signUpWithEmail, signInWithGoogle, actionPending, clearActionError } = useAuth();

const form = reactive({
  email: '',
  password: '',
  confirmPassword: ''
});

const errors = reactive({
  email: '',
  password: '',
  confirmPassword: ''
});

const isSubmitting = ref(false);
const submitError = ref('');

const redirectTarget = computed(() => {
  const queryRedirect = route.query.redirect;
  return typeof queryRedirect === 'string' && queryRedirect.startsWith('/') ? queryRedirect : '/analyze';
});

const validate = () => {
  errors.email = form.email.includes('@') ? '' : 'Enter a valid email address.';
  errors.password = form.password.length >= 8 ? '' : 'Password must be at least 8 characters.';
  errors.confirmPassword = form.password === form.confirmPassword ? '' : 'Passwords must match exactly.';
  return !errors.email && !errors.password && !errors.confirmPassword;
};

watch(() => ({ ...form }), () => {
  submitError.value = '';
  clearActionError();
});

const handleSubmit = async () => {
  submitError.value = '';
  clearActionError();

  if (!validate()) {
    return;
  }

  isSubmitting.value = true;
  try {
    await signUpWithEmail(form.email.trim(), form.password.trim());
    await router.push(redirectTarget.value);
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Unable to create that account.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleGoogleSignIn = async () => {
  submitError.value = '';
  clearActionError();

  try {
    await signInWithGoogle();
    await router.push(redirectTarget.value);
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Google sign-up failed.';
  }
};
</script>
