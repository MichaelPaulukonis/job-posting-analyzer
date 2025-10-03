# Playwright E2E Testing Notes

- E2E tests are located in `tests/playwright/`.
- Run all E2E tests:
  ```sh
  npm run test:e2e
  ```
- Run tests in headed mode (see the browser):
  ```sh
  npm run test:e2e:headed
  ```
- Use Playwright's UI mode for debugging:
  ```sh
  npm run test:e2e:ui
  ```
- Tests require the dev server running on http://localhost:3000.
- Node version is managed by `.nvmrc` and `.envrc` (see README).
- See `e2e-testing-strategy.md` in `notes/plans/` for the full strategy.
