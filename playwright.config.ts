import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: ['tests/playwright/**/*.spec.ts'], // Only run E2E specs
  // ...other config
});