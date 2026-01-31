export const defineNuxtPlugin = (plugin: any) => plugin;
export const defineNitroPlugin = (plugin: any) => plugin;
export const defineEventHandler = (handler: any) => handler;
export const createError = (input: { message?: string; statusCode?: number } = {}) => {
  const error = new Error(input.message ?? 'Nuxt error');
  (error as any).statusCode = input.statusCode ?? 500;
  return error;
};
export const useRuntimeConfig = () => ({
  public: {},
  server: {},
});
export const useRoute = () => ({ params: {}, query: {} });
export const useRouter = () => ({ push: () => Promise.resolve() });
export const useState = <T>(key: string, init?: () => T) => {
  const state = { key, value: init ? init() : undefined } as { key: string; value: T };
  return state;
};
export const $fetch = jest.fn(() => Promise.resolve({}));
export const defineNuxtRouteMiddleware = (fn: any) => fn;
