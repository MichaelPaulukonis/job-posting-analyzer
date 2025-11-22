# Authentication (Firebase)

This documentation explains how to set up Firebase authentication for local development and production, and how to configure the project.

## Overview

We use Firebase Authentication on the client (Firebase client SDK) and Firebase Admin SDK on the server (Nitro API endpoints) to verify ID tokens. The UI uses a `useAuth` composable and a `AuthService` that wraps Firebase operations.

## Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                       │
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Login UI   │ ───> │   useAuth    │ ───> │   Firebase   │  │
│  │  Component   │      │  Composable  │      │  Client SDK  │  │
│  └──────────────┘      └──────────────┘      └──────┬───────┘  │
│                                                      │           │
└──────────────────────────────────────────────────────┼──────────┘
                                                       │
                                    ID Token ──────────┘
                                        │
                        ┌───────────────▼──────────────┐
                        │     HTTP Request Headers     │
                        │  Authorization: Bearer <JWT> │
                        └───────────────┬──────────────┘
                                        │
┌───────────────────────────────────────▼──────────────────────────┐
│                       Server (Nuxt/Nitro)                         │
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                 │
│  │  API Endpoint    │ ───> │   requireAuth    │                 │
│  │  (Protected)     │      │     Utility      │                 │
│  └──────────────────┘      └────────┬─────────┘                 │
│                                     │                            │
│                          ┌──────────▼──────────┐                 │
│                          │  Firebase Admin SDK │                 │
│                          │   verifyIdToken()   │                 │
│                          └──────────┬──────────┘                 │
│                                     │                            │
│                          ┌──────────▼──────────┐                 │
│                          │  Decoded User Token │                 │
│                          │  { uid, email, ... }│                 │
│                          └─────────────────────┘                 │
└───────────────────────────────────────────────────────────────────┘
```

### Component Architecture

1. **Client Layer**
   - `plugins/firebase.client.ts` - Initializes Firebase client SDK
   - `composables/useAuth.ts` - Provides authentication methods
   - `services/AuthService.ts` - Wraps Firebase operations

2. **Server Layer**
   - `server/plugins/firebase.ts` - Initializes Firebase Admin SDK
   - `server/utils/verifyToken.ts` - Token verification utility
   - `server/middleware/verifyToken.ts` - Middleware exports
   - `server/api/auth/session.post.ts` - Session verification endpoint

3. **Protected API Endpoints**
   All protected endpoints use `requireAuth()` for token verification:
   - `/api/me` - Get current user info
   - `/api/analyze` - Job posting analysis
   - `/api/cover-letter/generate` - Cover letter generation
   - `/api/cover-letter-samples/*` - Cover letter samples management
   - `/api/memory/populate` - Memory population
   - `/api/admin/storage-files/*` - Admin storage operations
   - `/api/resumes/*` - Resume management
   - `/api/storage/*` - Storage operations

## Environment Variables

Add the following environment variables to `.env` for local development. In production, store these as secure secrets.

- NUXT_PUBLIC_FIREBASE_API_KEY
- NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NUXT_PUBLIC_FIREBASE_PROJECT_ID
- NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NUXT_PUBLIC_FIREBASE_APP_ID
- FIREBASE_SERVICE_ACCOUNT (server-only, base64-encoded JSON or path to a service account file)

### Notes on service account formats
- `FIREBASE_SERVICE_ACCOUNT` can be set as either:
	- A path to a local JSON file (e.g., `/path/to/firebase-key.json`), OR
	- The raw JSON object string (the JSON contents of the key) AS A SINGLE LINE, or
	- A base64-encoded JSON string (suitable for CI/Secrets). The server plugin accepts any of these formats.

Example (.env) using a path:
```
FIREBASE_SERVICE_ACCOUNT=/path/to/key.json
```

Example (.env) using a JSON string (careful about quotes):
```
FIREBASE_SERVICE_ACCOUNT='{ "type": "service_account", ... }'
```

Example (CI secret base64):
```
# In CI provide the secret, then decode in the build or runtime
FIREBASE_SERVICE_ACCOUNT=$(echo $FIREBASE_SERVICE_ACCOUNT_BASE64 | base64 --decode)
```

## Client setup

- The plugin `plugins/firebase.client.ts` handles initializing Firebase client SDK using runtime config.
- The composable `useAuth` wraps the auth flows: signInWithEmail, signUpWithEmail, signOut, and getting ID tokens.

#### Quick steps to obtain client config
1. In the Firebase Console, create or select your project
2. Add a new Web App and copy the SDK configuration (apiKey, authDomain, projectId, appId, etc.)
3. Add the values to your local `.env` or to your platform's environment variables as `NUXT_PUBLIC_FIREBASE_*` entries.

Example `.env` entries (client):
```
NUXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=<project>
NUXT_PUBLIC_FIREBASE_APP_ID=1:xxxxx:web:xxxxx
```

## Server setup

- The server endpoints in `server/api/auth/*` should use `firebase-admin` to verify ID tokens passed as a Bearer token in `Authorization: Bearer <token>`.

#### Quick steps to create a service account (server)
1. In the Firebase Console: Project Settings -> Service accounts
2. Click **Generate new private key** (a `.json` will be downloaded)
3. Either store the `.json` file on the server and set `FIREBASE_SERVICE_ACCOUNT=/path/to/key.json` in your environment, or
4. For CI/Cloud: Set `FIREBASE_SERVICE_ACCOUNT` to the literal JSON (or base64-encoded string) as a secret.

Be careful with secrets: never commit private keys into version control. Use CI/environment secrets and `nuxt` runtime config.

## Testing

- Unit tests: Add tests for `useAuth` and `FirebaseAuthService` using mocks for Firebase.
- E2E tests: Use Playwright to verify login, signup, and accessing protected routes.

### GitHub Actions example (CI) using a Base64-encoded service account
1. Create a new GitHub secret `FIREBASE_SERVICE_ACCOUNT_BASE64` with `base64 private-key.json`.
2. In the workflow, decode it into an environment variable before running the build/tests.

```yaml
	- name: Decode Firebase service account
		run: |
			echo "$FIREBASE_SERVICE_ACCOUNT_BASE64" | base64 --decode > firebase-service-account.json
			echo "FIREBASE_SERVICE_ACCOUNT=$(cat firebase-service-account.json)" >> $GITHUB_ENV
		env:
			FIREBASE_SERVICE_ACCOUNT_BASE64: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_BASE64 }}
```

Now `FIREBASE_SERVICE_ACCOUNT` will be available for plugin initialization.

## Troubleshooting

- Ensure `NUXT_PUBLIC_FIREBASE_*` variables are set in your environment. Check `nuxt.config.ts` to make sure runtime config public properties are mapped correctly.
- If server verification fails, verify the `FIREBASE_SERVICE_ACCOUNT` JSON and the admin SDK initialization.

## Troubleshooting checklist
- Browser `auth/invalid-api-key` — make sure your `NUXT_PUBLIC_FIREBASE_API_KEY` and other `NUXT_PUBLIC_FIREBASE_*` keys match your project's Web app config.
- Server init failure: check `FIREBASE_SERVICE_ACCOUNT` format (path vs raw JSON vs base64 string); `firebase-admin` expects valid service account credentials.
- If you use `firebase-admin` with role restrictions or GCP provisioning, ensure the account has `Firebase Admin` privileges.

If you need help generating the project configuration or creating secrets for CI, open an issue and include which environment you’re deploying to, and I’ll provide a template for that platform (e.g., Vercel, Netlify, GitHub Actions).

## Migration

- If migrating away from Firebase later, the `services/AuthService.ts` provides a simple interface to swap implementations.

## Usage Examples

### Protecting an API Endpoint

To protect a new API endpoint with authentication:

```typescript
// server/api/my-protected-endpoint.ts
import { defineEventHandler } from '#imports';
import { requireAuth } from '~/server/utils/verifyToken';

export default defineEventHandler(async (event) => {
  // Verify authentication - throws 401 if invalid/missing token
  const decoded = await requireAuth(event);
  
  // Access user information
  const userId = decoded.uid;
  const userEmail = decoded.email;
  
  // Your endpoint logic here
  return {
    message: 'Success',
    userId
  };
});
```

### Making Authenticated Requests from Client

```typescript
// In a Vue component or composable
const { getIdToken } = useAuth();

async function callProtectedEndpoint() {
  const token = await getIdToken();
  
  const response = await $fetch('/api/my-protected-endpoint', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response;
}
```

### Optional Authentication

For endpoints that work with or without authentication:

```typescript
// server/api/optional-auth-endpoint.ts
import { defineEventHandler } from '#imports';
import { requireAuth } from '~/server/utils/verifyToken';

export default defineEventHandler(async (event) => {
  let user = null;
  
  try {
    // Attempt to verify auth, but don't throw on failure
    user = await requireAuth(event);
  } catch (error) {
    // User is not authenticated, proceed with limited access
  }
  
  if (user) {
    // Return personalized content
    return { message: 'Hello ' + user.email };
  } else {
    // Return public content
    return { message: 'Hello guest' };
  }
});
```

## Security Considerations

### CSRF Protection

The application implements several CSRF protection measures:

1. **Token-based Authentication**: Uses Bearer tokens in Authorization headers instead of cookies, making CSRF attacks ineffective
2. **Origin Validation**: Server validates the origin of requests
3. **Same-Site Cookies**: When cookies are used, they are set with `SameSite` attribute
4. **Short-lived Tokens**: Firebase ID tokens expire after 1 hour, limiting the window for potential attacks

### Secure Token Handling

1. **HTTPS Only**: All authentication flows should use HTTPS in production
2. **Token Storage**: Tokens are stored in memory and sessionStorage (not localStorage for security)
3. **Token Expiration**: Tokens automatically expire and require refresh
4. **No Token in URL**: Tokens are never passed in URL parameters

### Rate Limiting

While not implemented at the application level, consider these best practices:

1. **Firebase Rate Limits**: Firebase automatically rate limits authentication attempts
2. **Server-side Rate Limiting**: Consider adding rate limiting middleware for API endpoints:
   ```typescript
   // Example rate limiting (not yet implemented)
   import rateLimit from 'express-rate-limit';
   
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5 // limit each IP to 5 requests per windowMs
   });
   ```

### Token Verification Best Practices

The `requireAuth` utility follows these security practices:

1. **Strict Verification**: Verifies token signature using Firebase Admin SDK
2. **Expiration Check**: Automatically rejects expired tokens
3. **Issuer Validation**: Verifies the token was issued by Firebase
4. **Audience Check**: Ensures token is for the correct project

### Admin Operations

Admin operations (in `/api/admin/*`) are protected but should have additional role checks:

```typescript
// Recommended pattern for admin operations
export default defineEventHandler(async (event) => {
  const decoded = await requireAuth(event);
  
  // Check custom claims for admin role
  if (!decoded.admin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Admin access required'
    });
  }
  
  // Admin operation logic
});
```

### Security Checklist

- ✅ ID tokens verified using Firebase Admin SDK
- ✅ Tokens transmitted via Authorization header (not cookies)
- ✅ Automatic token expiration (1 hour)
- ✅ Error messages don't leak sensitive information
- ✅ Protected endpoints consistently use `requireAuth`
- ⚠️ Rate limiting recommended for production
- ⚠️ Admin role verification recommended for admin endpoints
- ⚠️ HTTPS enforcement recommended for production

## Advanced Troubleshooting

### Common Issues and Solutions

#### 1. "Invalid or expired authorization token" (401)

**Symptoms**: API calls fail with 401 error even with valid Firebase user

**Possible Causes**:
- Token has expired (tokens expire after 1 hour)
- Token not properly included in Authorization header
- Server-side Firebase Admin not properly initialized
- Service account credentials are incorrect

**Solutions**:
```typescript
// Ensure token is fresh
const { getIdToken } = useAuth();
const token = await getIdToken(true); // Force refresh

// Verify header format
headers: {
  'Authorization': `Bearer ${token}` // Note the space after "Bearer"
}

// Check server logs for Firebase Admin initialization errors
```

#### 2. "Missing authorization token" (401)

**Symptoms**: Protected endpoint immediately returns 401

**Possible Causes**:
- Authorization header not sent
- Token extraction failing
- CORS issues preventing header transmission

**Solutions**:
```typescript
// Verify token is being sent
console.log('Sending token:', token);

// Check CORS configuration in nuxt.config.ts
// Ensure headers are allowed
```

#### 3. Firebase Admin Initialization Failures

**Symptoms**: Server crashes on startup or authentication always fails

**Possible Causes**:
- `FIREBASE_SERVICE_ACCOUNT` not set or malformed
- Service account JSON has wrong permissions
- Project ID mismatch

**Solutions**:
```bash
# Verify environment variable is set
echo $FIREBASE_SERVICE_ACCOUNT

# Check service account format (should be valid JSON)
# If using base64, ensure it decodes properly
echo $FIREBASE_SERVICE_ACCOUNT | base64 --decode | jq .

# Verify project_id matches your Firebase project
```

#### 4. Authentication Works Locally But Fails in Production

**Possible Causes**:
- Environment variables not set in production
- Service account not properly deployed
- CORS restrictions

**Solutions**:
- Verify all `NUXT_PUBLIC_FIREBASE_*` variables are set in production environment
- Confirm `FIREBASE_SERVICE_ACCOUNT` is available to server runtime
- Check browser console for CORS errors
- Ensure production URL is added to Firebase authorized domains

#### 5. Token Verification Slow or Timing Out

**Possible Causes**:
- Firebase Admin SDK making external API calls
- Network connectivity issues
- Cold start delays

**Solutions**:
- Firebase Admin SDK caches public keys, subsequent verifications are fast
- Consider implementing token caching for frequently accessed routes
- Ensure server has stable internet connection to Firebase services

### Debugging Tools

#### Enable Detailed Logging

```typescript
// In server/utils/verifyToken.ts (for debugging)
export const requireAuth = async (event: H3Event, options: RequireAuthOptions = {}) => {
  const config = useRuntimeConfig();
  
  console.log('Auth check:', {
    authDisabled: config.public?.authDisabled,
    hasToken: !!options.token,
    hasHeader: !!getAuthTokenFromHeader(event)
  });
  
  // ... rest of function
};
```

#### Test Token Validity

```bash
# Use curl to test protected endpoint
TOKEN="your-firebase-id-token"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/me
```

#### Verify Service Account Permissions

In Firebase Console:
1. Go to Project Settings → Service Accounts
2. Verify the service account exists
3. Check it has "Firebase Admin SDK Administrator" role
4. Generate a new key if needed

### Performance Optimization

1. **Token Caching**: Firebase Admin SDK caches verification keys automatically
2. **Connection Reuse**: Admin SDK maintains persistent connections
3. **Disable Auth in Development** (optional):
   ```typescript
   // nuxt.config.ts
   runtimeConfig: {
     public: {
       authDisabled: process.env.DISABLE_AUTH === 'true'
     }
   }
   ```

## Comprehensive Testing Guide

### Unit Tests

Unit tests for authentication components use Jest mocks:

```typescript
// Example: Testing a protected endpoint
import { requireAuth } from '~/server/utils/verifyToken';

jest.mock('~/server/utils/verifyToken', () => ({
  requireAuth: jest.fn()
}));

describe('Protected Endpoint', () => {
  it('returns data for authenticated user', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com'
    });
    
    const result = await handler(mockEvent);
    expect(result).toHaveProperty('data');
  });
  
  it('throws 401 for unauthenticated request', async () => {
    (requireAuth as jest.Mock).mockRejectedValue({
      statusCode: 401
    });
    
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 401
    });
  });
});
```

### Integration Tests

```bash
# Run Jest tests
npm run test

# Run specific auth tests
npm run test -- tests/server/api/auth
```

### End-to-End Tests

Playwright tests verify the complete authentication flow:

```typescript
// Example E2E test
test('user can login and access protected page', async ({ page }) => {
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'testpassword');
  await page.click('button[type="submit"]');
  
  // Verify redirect to protected page
  await expect(page).toHaveURL('/dashboard');
  
  // Verify protected content loads
  await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
});
```

Run E2E tests:
```bash
npm run test:e2e
```

### Manual Testing Checklist

- [ ] User can sign up with email/password
- [ ] User can log in with valid credentials
- [ ] User cannot log in with invalid credentials
- [ ] Protected pages redirect to login when not authenticated
- [ ] Protected API endpoints return 401 when not authenticated
- [ ] Protected API endpoints work with valid token
- [ ] Token refresh works correctly
- [ ] User can log out
- [ ] Session persists across page reloads
- [ ] Authentication state is reactive in UI

### Testing with Disabled Auth

For development convenience, authentication can be disabled:

```bash
# .env.local
NUXT_PUBLIC_AUTH_DISABLED=true
```

When disabled:
- `requireAuth` returns `null` without verification
- Protected endpoints remain accessible
- Useful for frontend development without Firebase setup
