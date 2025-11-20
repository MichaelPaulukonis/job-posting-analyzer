import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return;
  }

  const { isAuthenticated, waitForAuthReady } = useAuth();
  await waitForAuthReady();

  const redirectQuery = typeof to.query?.redirect === 'string' ? to.query.redirect : null;

  if (to.meta?.requiresAuth && !isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  }

  if (to.meta?.requiresGuest && isAuthenticated.value) {
    return navigateTo(redirectQuery || '/');
  }
});
