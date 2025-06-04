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
      // We don't expose the actual API keys to the client
      geminiApiAvailable: !!process.env.GEMINI_API_KEY,
      anthropicApiAvailable: !!process.env.ANTHROPIC_API_KEY,
    }
  },

  // Configure Nitro to ignore specific directories
  nitro: {
    ignore: [
      'notes/**', // Ignore the entire notes directory and its contents
    ]
  },

  compatibilityDate: '2025-05-01'
})