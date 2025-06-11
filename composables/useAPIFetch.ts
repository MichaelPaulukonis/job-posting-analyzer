import { useFetch } from "#app"

type useFetchType = typeof useFetch

// wrap useFetch with configuration needed to talk to our API
export const useAPIFetch: useFetchType = (path, options = {}) => {
  const config = useRuntimeConfig()

  return useFetch(path, {...options, baseURL: config.public.baseUrl})
}

// from https://stackoverflow.com/a/75870302/41153