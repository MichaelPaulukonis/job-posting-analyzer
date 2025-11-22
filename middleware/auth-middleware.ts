import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { useAuth } from '~/composables/useAuth';
import { authGuard } from '~/middleware/auth';

const nuxtAuthMiddleware = async (to: any) => {
  const { isAuthenticated, waitForAuthReady } = useAuth();
  const result = await authGuard(to, { isAuthenticated, waitForAuthReady });
  if (result) {
    return navigateTo(result);
  }
};

export default defineNuxtRouteMiddleware(nuxtAuthMiddleware);
import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { useAuth } from '~/composables/useAuth';
import { authGuard } from '~/middleware/auth';

const nuxtAuthMiddleware = async (to: any) => {
  const { isAuthenticated, waitForAuthReady } = useAuth();
  const result = await authGuard(to, { isAuthenticated, waitForAuthReady });
  if (result) {
    return navigateTo(result);
  }
};

export default defineNuxtRouteMiddleware(nuxtAuthMiddleware);