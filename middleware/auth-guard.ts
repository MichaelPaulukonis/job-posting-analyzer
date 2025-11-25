// Only export the plain authGuard function for testing and composable use
export async function authGuard(to: any, { isAuthenticated, waitForAuthReady }: { isAuthenticated: { value: boolean }, waitForAuthReady?: () => Promise<void> }) {
  // SSR guard: skip client-only logic during server-side rendering
  if (typeof window === 'undefined') {
    return;
  }

  if (waitForAuthReady) {
    await waitForAuthReady();
  }

  const redirectQuery = typeof to.query?.redirect === 'string' ? to.query.redirect : null;

  if (to.meta?.requiresAuth && !isAuthenticated?.value) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (to.meta?.requiresGuest && isAuthenticated?.value) {
    return redirectQuery || '/';
  }
}
