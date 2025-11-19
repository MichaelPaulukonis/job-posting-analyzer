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

## Client setup

- The plugin `plugins/firebase.client.ts` handles initializing Firebase client SDK using runtime config.
- The composable `useAuth` wraps the auth flows: signInWithEmail, signUpWithEmail, signOut, and getting ID tokens.

## Server setup

- The server endpoints in `server/api/auth/*` should use `firebase-admin` to verify ID tokens passed as a Bearer token in `Authorization: Bearer <token>`.

## Testing

- Unit tests: Add tests for `useAuth` and `FirebaseAuthService` using mocks for Firebase.
- E2E tests: Use Playwright to verify login, signup, and accessing protected routes.

## Troubleshooting

- Ensure `NUXT_PUBLIC_FIREBASE_*` variables are set in your environment. Check `nuxt.config.ts` to make sure runtime config public properties are mapped correctly.
- If server verification fails, verify the `FIREBASE_SERVICE_ACCOUNT` JSON and the admin SDK initialization.

## Migration

- If migrating away from Firebase later, the `services/AuthService.ts` provides a simple interface to swap implementations.
