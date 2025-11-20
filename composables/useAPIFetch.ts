import { useFetch } from '#app';
import { useRuntimeConfig } from '#imports';
import { useAuth } from '~/composables/useAuth';

type UseFetchType = typeof useFetch;
type UseFetchArgs = Parameters<UseFetchType>;

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
  const mergedOptions: UseFetchArgs[1] = {
    ...options,
    baseURL: options.baseURL ?? config.public.apiBase ?? config.public.baseUrl
  };

  const originalOnRequest = options.onRequest;

  if (process.client) {
    mergedOptions.onRequest = async (ctx) => {
      if (!authBypassEnabled) {
        try {
          const { getIdToken } = useAuth();
          const token = await getIdToken?.();
          if (token) {
            const headers = toHeaders(ctx.options.headers as HeadersInit | undefined);
            if (!headers.has('Authorization')) {
              headers.set('Authorization', `Bearer ${token}`);
              ctx.options.headers = headers;
            }
          }
        } catch (error) {
          console.warn('Unable to attach auth token to request', error);
        }
      }

      if (typeof originalOnRequest === 'function') {
        await originalOnRequest(ctx);
      }
    };
  } else if (typeof originalOnRequest === 'function') {
    mergedOptions.onRequest = originalOnRequest;
  }

  return useFetch(path, mergedOptions);
};

// from https://stackoverflow.com/a/75870302/41153