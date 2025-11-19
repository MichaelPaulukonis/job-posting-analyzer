import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports';

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig();
  // Use route meta to check if route is protected
  if (to.meta && to.meta.requiresAuth) {
    const nuxtApp = useNuxtApp();
    const { $firebaseAuth } = nuxtApp as any;

    // TODO: replace with actual auth check
    const user = $firebaseAuth?.currentUser;
    if (!user) {
      return navigateTo('/login');
    }
  }
});
