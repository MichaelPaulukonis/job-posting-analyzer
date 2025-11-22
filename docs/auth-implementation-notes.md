# Authentication Implementation Notes

## Middleware and Utilities

- **server/utils/verifyToken.ts**
  - Provides `requireAuth` for verifying Firebase ID tokens.
  - Extracts token from the Authorization header or passed option.
  - Throws a 401 error for missing/invalid/expired tokens.
  - On success, attaches decoded token to the event context.

- **server/middleware/verifyToken.ts**
  - Exports a no-op middleware by default (does not apply globally).
  - Re-exports `requireAuth` from the utility for explicit use in routes.

- **server/api/auth/session.post.ts**
  - Reads token from request body.
  - Calls `requireAuth` to verify and decode the token.
  - Returns decoded token info and an `authDisabled` flag.

## Key Points
- Authentication middleware and session endpoint logic are present, but not applied globally—they must be explicitly used in each route.
- Error handling and token verification are robust and follow best practices.
- All protected routes should use this pattern for consistent security.

---
This document summarizes the current authentication implementation and can be expanded for subtask 25.8 documentation and security review.
