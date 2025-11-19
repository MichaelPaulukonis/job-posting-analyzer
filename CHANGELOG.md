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

