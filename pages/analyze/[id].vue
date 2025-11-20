<template>
  <AnalyzePage />
</template>

<script setup lang="ts">
import AnalyzePage from '../analyze.vue';

definePageMeta({
  middleware: ['auth'],
  requiresAuth: true
});
</script>
