import { useFetch } from '#app';
import { useRuntimeConfig } from '#imports';
import { useAuth } from '~/composables/useAuth';

type UseFetchType = typeof useFetch;
type UseFetchArgs = Parameters<UseFetchType>;
const AUTH_FORCE_REFRESH_FLAG = '__authForceRefresh';
const AUTH_RETRY_FLAG = '__authRetryAttempted';

const toHeaders = (headers?: HeadersInit): Headers => {
  if (headers instanceof Headers) {
    return new Headers(headers);
  }

  if (Array.isArray(headers)) {
    return new Headers(headers);
  }

  return new Headers(headers ?? {});
};

// Wrap useFetch with configuration needed to talk to our API and automatically attach auth tokens.
export const useAPIFetch: UseFetchType = (path, options: UseFetchArgs[1] = {}) => {
  const config = useRuntimeConfig();
  const authBypassEnabled = Boolean(config.public?.authDisabled);
  const defaultBaseUrl = config.public.apiBase ?? config.public.baseUrl;
  const mergedOptions: UseFetchArgs[1] = {
    ...options
  };

  if (options?.baseURL) {
    mergedOptions.baseURL = options.baseURL;
  } else if (process.client) {
    // In development, don't set baseURL to allow relative URLs
    // This prevents CORS issues when client and server are on different ports
    // In production, Nuxt handles this automatically
    if (process.env.NODE_ENV === 'production' && defaultBaseUrl) {
      mergedOptions.baseURL = defaultBaseUrl;
    }
    // In development, leave baseURL undefined to use relative URLs
  }

  const originalOnRequest = options.onRequest;
  const originalOnResponse = options.onResponse;
  const originalOnResponseError = options.onResponseError;

  if (process.client) {
    if (typeof mergedOptions.retry === 'undefined') {
      mergedOptions.retry = 1;
    }

    if (typeof mergedOptions.retryStatusCodes === 'undefined') {
      mergedOptions.retryStatusCodes = [401];
    } else if (Array.isArray(mergedOptions.retryStatusCodes) && !mergedOptions.retryStatusCodes.includes(401)) {
      mergedOptions.retryStatusCodes = [...mergedOptions.retryStatusCodes, 401];
    }
  }

  if (process.client) {
    mergedOptions.onRequest = async (ctx) => {
      if (!authBypassEnabled) {
        try {
          const { getIdToken, waitForAuthReady } = useAuth();
          await waitForAuthReady?.();
          const mutableOptions = ctx.options as Record<string, unknown>;
          const forceRefresh = Boolean(mutableOptions[AUTH_FORCE_REFRESH_FLAG]);
          const token = await getIdToken?.({ forceRefresh });
          if (token) {
            const headers = toHeaders(ctx.options.headers as HeadersInit | undefined);
            if (!headers.has('Authorization')) {
              headers.set('Authorization', `Bearer ${token}`);
              ctx.options.headers = headers;
            }
          }
          mutableOptions[AUTH_FORCE_REFRESH_FLAG] = false;
        } catch (error) {
          console.warn('Unable to attach auth token to request', error);
        }
      }

      if (typeof originalOnRequest === 'function') {
        await originalOnRequest(ctx);
      }
    };

    mergedOptions.onResponse = async (ctx) => {
      const mutableOptions = ctx.options as Record<string, unknown>;
      mutableOptions[AUTH_RETRY_FLAG] = false;
      mutableOptions[AUTH_FORCE_REFRESH_FLAG] = false;

      if (typeof originalOnResponse === 'function') {
        await originalOnResponse(ctx);
      }
    };

    mergedOptions.onResponseError = async (ctx) => {
      if (!authBypassEnabled && ctx.response?.status === 401) {
        const mutableOptions = ctx.options as Record<string, unknown>;
        if (!mutableOptions[AUTH_RETRY_FLAG]) {
          mutableOptions[AUTH_RETRY_FLAG] = true;
          mutableOptions[AUTH_FORCE_REFRESH_FLAG] = true;
        }
      }

      if (typeof originalOnResponseError === 'function') {
        await originalOnResponseError(ctx);
      }
    };
  } else {
    if (typeof originalOnRequest === 'function') {
      mergedOptions.onRequest = originalOnRequest;
    }
    if (typeof originalOnResponse === 'function') {
      mergedOptions.onResponse = originalOnResponse;
    }
    if (typeof originalOnResponseError === 'function') {
      mergedOptions.onResponseError = originalOnResponseError;
    }
  }

  return useFetch(path, mergedOptions);
};

// from https://stackoverflow.com/a/75870302/41153