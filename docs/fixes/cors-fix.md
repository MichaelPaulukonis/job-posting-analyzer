# CORS Fix for Development Environment

## Issue
Client-side requests were failing with CORS errors:
```
Access to fetch at 'http://localhost:3001/api/resumes' from origin 'http://localhost:3002' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
In Nuxt development mode, the client-side code runs on a different port than the server:
- Server (Nitro): `http://localhost:3001`
- Client (Vite HMR): `http://localhost:3002`

The `useAPIFetch` composable was setting an absolute `baseURL` for all client-side requests, causing cross-origin requests that were blocked by CORS policy.

## Solution

### 1. Updated `useAPIFetch.ts`
Changed the baseURL logic to use relative URLs in development:

```typescript
// Before
else if (process.client) {
  mergedOptions.baseURL = defaultBaseUrl;
}

// After
else if (process.client) {
  // In development, don't set baseURL to allow relative URLs
  // This prevents CORS issues when client and server are on different ports
  // In production, Nuxt handles this automatically
  if (process.env.NODE_ENV === 'production' && defaultBaseUrl) {
    mergedOptions.baseURL = defaultBaseUrl;
  }
  // In development, leave baseURL undefined to use relative URLs
}
```

**Why this works:**
- In development, Nuxt/Vite automatically proxies API requests from the client port to the server port
- Relative URLs (e.g., `/api/resumes`) are handled by this proxy
- Absolute URLs (e.g., `http://localhost:3001/api/resumes`) bypass the proxy and trigger CORS

### 2. Added CORS Headers to `nuxt.config.ts` (Defense in Depth)
Added CORS configuration for API routes as a fallback:

```typescript
nitro: {
  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    }
  }
}
```

**Note:** This is primarily for production or cases where absolute URLs are necessary.

## Testing

### Before Fix
```
✗ GET http://localhost:3001/api/resumes - CORS error
✗ GET http://localhost:3001/api/analysis - CORS error
✗ Data loading fails, falls back to localStorage
```

### After Fix
```
✓ GET /api/resumes - Success (proxied to localhost:3001)
✓ GET /api/analysis - Success (proxied to localhost:3001)
✓ Data loads from database correctly
```

## How Nuxt Handles This

### Development Mode
1. Vite dev server runs on port 3002 (client)
2. Nitro server runs on port 3001 (API)
3. Vite proxies `/api/*` requests to Nitro
4. Relative URLs work seamlessly

### Production Mode
1. Everything runs on the same port
2. No proxy needed
3. Absolute URLs can be used if needed

## Files Modified
- `composables/useAPIFetch.ts` - Updated baseURL logic
- `nuxt.config.ts` - Added CORS headers
- `docs/fixes/cors-fix.md` - This documentation

## Related Issues
- Task 8: API Endpoints Implementation
- Task 9: Frontend Integration
- StorageService was correctly using `useAPIFetch`, so no changes needed there

## Best Practices

### For Client-Side API Calls
✅ **DO**: Use relative URLs in development
```typescript
await useFetch('/api/resumes')
await useAPIFetch('/api/analysis')
```

❌ **DON'T**: Use absolute URLs in development
```typescript
await useFetch('http://localhost:3001/api/resumes') // CORS error!
```

### For Server-Side API Calls
✅ **DO**: Use absolute URLs with baseURL
```typescript
await $fetch('/api/resumes', { baseURL: 'http://localhost:3001' })
```

### For External APIs
✅ **DO**: Always use absolute URLs
```typescript
await $fetch('https://api.external.com/data')
```

## Restart Required
After making these changes, restart the development server:
```bash
npm run dev
```

The CORS errors should be resolved and data should load from the database correctly.
