// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  
  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (server-side only)
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-pro',
    
    // Public keys that can be accessed client-side
    public: {
      // We don't expose the actual API keys to the client
      geminiApiAvailable: !!process.env.GEMINI_API_KEY,
    }
  }
})
