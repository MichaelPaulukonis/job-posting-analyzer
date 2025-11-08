import { version } from './package.json';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (server-side only)
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-pro',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-2',
    // Public keys that can be accessed client-side
    public: {
      appVersion: version,
      // We don't expose the actual API keys to the client
      geminiApiAvailable: !!process.env.GEMINI_API_KEY,
      anthropicApiAvailable: !!process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.BASE_URL || 'http://localhost:3001', // Updated default port
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.BASE_URL || 'http://localhost:3001' // Updated default port
    }
  },

  // Configure Nitro to ignore specific directories
  nitro: {
    ignore: [
      'notes/**', // Ignore the entire notes directory and its contents
    ]
  },

  // Dev server configuration
  devServer: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
    host: process.env.HOST || '0.0.0.0'
  },

  compatibilityDate: '2025-05-01'
})