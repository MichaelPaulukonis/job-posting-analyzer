# Authentication (Firebase)

This documentation explains how to set up Firebase authentication for local development and production, and how to configure the project.

## Overview

We use Firebase Authentication on the client (Firebase client SDK) and Firebase Admin SDK on the server (Nitro API endpoints) to verify ID tokens. The UI uses a `useAuth` composable and a `AuthService` that wraps Firebase operations.

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
