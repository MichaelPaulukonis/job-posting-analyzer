# Changelog

## Unreleased

### Added

- feat(auth): Add Firebase authentication scaffolding and initial implementation
  - Add Firebase client plugin and Admin server plugin
  - Add `useAuth` composable and `AuthServiceInterface` + `FirebaseAuthService`
  - Add middleware to verify tokens and `me` API endpoint
  - Add login/signup pages and `AuthBar` UI
  - Add auth-related tests (placeholders) and documentation


  ### Changed

  - chore(test): add Jest setup, Firebase mocks, `.env.test`, and CI workflow to make tests deterministic and reduce reliance on live Firebase.

### Changed

- feat(auth): Harden Firebase authentication and enforce secure route protection
  - Refactor and complete `FirebaseAuthService` with robust error handling, type safety, and full test coverage
  - Implement server-side token verification via `requireAuth` in all protected API endpoints
  - Add Nuxt route middleware and testable `authGuard` for navigation and route protection
  - Remove obsolete endpoints and ensure all protected routes use explicit authentication checks
  - Expand documentation (`auth.md`, `auth-implementation-notes.md`) with architecture, troubleshooting, and security review
  - Comprehensive unit and integration tests for all authentication flows, middleware, and endpoints

