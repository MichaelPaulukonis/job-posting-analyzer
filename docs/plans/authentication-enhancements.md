# Firebase Authentication Enhancement Plan

## Overview

This document outlines potential enhancements to the existing Firebase Authentication implementation. The current system provides basic email/password and Google OAuth authentication with route protection. These enhancements would improve security, user experience, and account management capabilities.

## Current State

### ✅ Implemented Features
- Email/password authentication (sign up, sign in)
- Google OAuth authentication
- Server-side token verification with Firebase Admin SDK
- Client-side auth state management
- Protected API endpoints with `requireAuth()` middleware
- Route protection with auth guards
- Login and signup pages with validation

### 📋 Architecture
- **Frontend**: Firebase Client SDK via `plugins/firebase.client.ts`
- **Backend**: Firebase Admin SDK via `server/utils/firebaseAdmin.ts`
- **Auth Composable**: `composables/useAuth.ts`
- **Middleware**: `middleware/auth.ts` and `middleware/auth-guard.ts`
- **Token Verification**: `server/utils/verifyToken.ts`

## Proposed Enhancements

### 1. Password Reset Flow

**Priority**: High  
**Effort**: Medium  
**Dependencies**: Email service configuration

#### Description
Implement a complete password reset workflow allowing users to securely reset forgotten passwords via email.

#### Implementation Details

**Frontend Components**:
- `/pages/forgot-password.vue` - Request reset link page
- `/pages/reset-password.vue` - Set new password page
- Add "Forgot password?" link to login page

**Backend Endpoints**:
- `POST /api/auth/send-password-reset` - Send reset email
- `POST /api/auth/verify-reset-code` - Validate reset code
- No backend needed for actual reset (handled by Firebase)

**Firebase Methods**:
```typescript
// In useAuth composable
async function sendPasswordResetEmail(email: string) {
  const auth = getAuthOrThrow();
  return runAuthAction(async () => {
    await firebaseSendPasswordResetEmail(auth, email);
  });
}

async function confirmPasswordReset(code: string, newPassword: string) {
  const auth = getAuthOrThrow();
  return runAuthAction(async () => {
    await firebaseConfirmPasswordReset(auth, code, newPassword);
  });
}
```

**User Flow**:
1. User clicks "Forgot password?" on login page
2. User enters email address
3. Firebase sends password reset email
4. User clicks link in email (redirects to `/reset-password?oobCode=...`)
5. User enters new password
6. Password is reset, user redirected to login

**Testing Requirements**:
- Unit tests for composable methods
- Integration tests for reset flow
- Email delivery verification (staging)
- Security testing for code validation

---

### 2. Email Verification

**Priority**: High  
**Effort**: Medium  
**Dependencies**: Email service configuration

#### Description
Require users to verify their email address before accessing protected features. Prevents fake accounts and ensures valid contact information.

#### Implementation Details

**Frontend Components**:
- `/pages/verify-email.vue` - Email verification status page
- Banner component for unverified users
- Resend verification email button

**Backend Changes**:
- Modify `requireAuth()` to check `emailVerified` status
- Add optional `requireVerifiedEmail` parameter
- Create `POST /api/auth/send-verification-email` endpoint

**Firebase Methods**:
```typescript
// In useAuth composable
async function sendEmailVerification() {
  const currentUser = user.value;
  if (!currentUser) throw new Error('No user signed in');
  
  return runAuthAction(async () => {
    await firebaseSendEmailVerification(currentUser);
  });
}

async function applyActionCode(code: string) {
  const auth = getAuthOrThrow();
  return runAuthAction(async () => {
    await firebaseApplyActionCode(auth, code);
    await currentUser?.reload();
  });
}
```

**User Flow**:
1. User signs up with email/password
2. Verification email sent automatically
3. User sees banner: "Please verify your email"
4. User clicks link in email
5. Email verified, banner disappears

**Configuration Options**:
- Enforce verification for all users
- Enforce verification for specific features only
- Grace period before enforcement (e.g., 7 days)

**Testing Requirements**:
- Test verification flow end-to-end
- Test resend functionality
- Test expired verification links
- Test already-verified users

---

### 3. User Profile Management

**Priority**: Medium  
**Effort**: Medium  
**Dependencies**: User database schema

#### Description
Allow users to view and update their profile information including display name, email, and password.

#### Implementation Details

**Database Schema** (Prisma):
```prisma
model User {
  id            String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  firebaseUid   String   @unique @map("firebase_uid") @db.VarChar(128)
  email         String   @unique @db.VarChar(255)
  displayName   String?  @map("display_name") @db.VarChar(255)
  photoURL      String?  @map("photo_url") @db.Text
  emailVerified Boolean  @default(false) @map("email_verified")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  lastLoginAt   DateTime? @map("last_login_at") @db.Timestamptz(6)

  // Existing relations...
  resumes        Resume[]
  jobPostings    JobPosting[]
  conversations  Conversation[]

  @@map("users")
}
```

**Frontend Components**:
- `/pages/profile.vue` - Profile management page
- `/pages/settings.vue` - Account settings page
- Profile dropdown in navigation

**Backend Endpoints**:
- `GET /api/user/profile` - Get current user profile
- `PATCH /api/user/profile` - Update profile (display name, photo)
- `POST /api/user/change-email` - Change email address
- `POST /api/user/change-password` - Change password
- `DELETE /api/user/account` - Delete account

**Firebase Methods**:
```typescript
// In useAuth composable
async function updateProfile(updates: { displayName?: string; photoURL?: string }) {
  const currentUser = user.value;
  if (!currentUser) throw new Error('No user signed in');
  
  return runAuthAction(async () => {
    await firebaseUpdateProfile(currentUser, updates);
    await currentUser.reload();
  });
}

async function updateEmail(newEmail: string) {
  const currentUser = user.value;
  if (!currentUser) throw new Error('No user signed in');
  
  return runAuthAction(async () => {
    await firebaseUpdateEmail(currentUser, newEmail);
  });
}

async function updatePassword(newPassword: string) {
  const currentUser = user.value;
  if (!currentUser) throw new Error('No user signed in');
  
  return runAuthAction(async () => {
    await firebaseUpdatePassword(currentUser, newPassword);
  });
}
```

**Features**:
- Display name editing
- Profile photo upload (S3 integration)
- Email change with re-verification
- Password change with current password confirmation
- Account activity log (last login, created date)

**Testing Requirements**:
- Test profile updates sync to database
- Test email change requires re-verification
- Test password change requires re-authentication
- Test validation for all fields

---

### 4. Session Management

**Priority**: Medium  
**Effort**: Low  
**Dependencies**: None

#### Description
Implement session timeout, "remember me" functionality, and active session management.

#### Implementation Details

**Session Timeout**:
```typescript
// In useAuth composable
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let sessionTimer: NodeJS.Timeout | null = null;

function resetSessionTimer() {
  if (sessionTimer) clearTimeout(sessionTimer);
  
  sessionTimer = setTimeout(async () => {
    await signOut();
    // Show session expired message
    navigateTo('/login?reason=session-expired');
  }, SESSION_TIMEOUT);
}

// Reset timer on user activity
if (isClient()) {
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetSessionTimer, { passive: true });
  });
}
```

**Remember Me**:
```typescript
async function signInWithEmail(email: string, password: string, rememberMe: boolean = false) {
  const auth = getAuthOrThrow();
  
  // Set persistence based on remember me
  const persistence = rememberMe 
    ? browserLocalPersistence 
    : browserSessionPersistence;
    
  await setPersistence(auth, persistence);
  
  return runAuthAction(async () => {
    const credential = await firebaseSignInWithEmailAndPassword(auth, email, password);
    return credential.user;
  });
}
```

**Active Sessions**:
- Track active sessions in database
- Show list of active devices/locations
- Allow users to revoke sessions
- Automatic cleanup of expired sessions

**Backend Endpoints**:
- `GET /api/user/sessions` - List active sessions
- `DELETE /api/user/sessions/:id` - Revoke specific session
- `DELETE /api/user/sessions` - Revoke all other sessions

**Testing Requirements**:
- Test session timeout triggers correctly
- Test remember me persists across browser restarts
- Test session revocation works
- Test concurrent session limits (if implemented)

---

### 5. Multi-Factor Authentication (MFA)

**Priority**: Low  
**Effort**: High  
**Dependencies**: SMS service (optional), TOTP library

#### Description
Add an optional second factor of authentication for enhanced security using TOTP (Time-based One-Time Password) or SMS.

#### Implementation Details

**MFA Methods**:
1. **TOTP (Recommended)** - Authenticator apps (Google Authenticator, Authy)
2. **SMS** - Text message codes (requires Twilio/similar)
3. **Backup Codes** - One-time use recovery codes

**Frontend Components**:
- `/pages/settings/security.vue` - MFA setup page
- `/pages/mfa-verify.vue` - MFA verification during login
- QR code display for TOTP setup
- Backup codes display and download

**Backend Endpoints**:
- `POST /api/user/mfa/enroll` - Start MFA enrollment
- `POST /api/user/mfa/verify-enrollment` - Complete MFA setup
- `POST /api/user/mfa/verify` - Verify MFA code during login
- `POST /api/user/mfa/disable` - Disable MFA
- `POST /api/user/mfa/backup-codes` - Generate new backup codes

**Database Schema**:
```prisma
model User {
  // ... existing fields
  mfaEnabled    Boolean  @default(false) @map("mfa_enabled")
  mfaSecret     String?  @map("mfa_secret") @db.VarChar(255)
  backupCodes   String[] @default([]) @map("backup_codes")
}
```

**Firebase Integration**:
```typescript
// Firebase supports MFA natively
import { multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator } from 'firebase/auth';

async function enrollMFA(phoneNumber: string) {
  const currentUser = user.value;
  if (!currentUser) throw new Error('No user signed in');
  
  return runAuthAction(async () => {
    const multiFactorSession = await multiFactor(currentUser).getSession();
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      phoneNumber,
      multiFactorSession
    );
    return verificationId;
  });
}
```

**User Flow**:
1. User enables MFA in settings
2. User scans QR code with authenticator app
3. User enters verification code to confirm setup
4. Backup codes generated and displayed
5. On next login, user enters password then MFA code
6. User can use backup code if device unavailable

**Testing Requirements**:
- Test TOTP code generation and validation
- Test backup codes work correctly
- Test MFA can be disabled with verification
- Test account recovery without MFA device
- Security testing for MFA bypass attempts

---

### 6. Account Deletion

**Priority**: Low  
**Effort**: Medium  
**Dependencies**: Data retention policy

#### Description
Allow users to permanently delete their account and associated data, complying with GDPR and privacy regulations.

#### Implementation Details

**Frontend Components**:
- `/pages/settings/delete-account.vue` - Account deletion page
- Confirmation modal with password re-entry
- Data export option before deletion

**Backend Endpoints**:
- `POST /api/user/request-deletion` - Request account deletion
- `POST /api/user/confirm-deletion` - Confirm and execute deletion
- `GET /api/user/export-data` - Export user data (GDPR compliance)

**Deletion Process**:
```typescript
// server/api/user/confirm-deletion.post.ts
export default defineEventHandler(async (event) => {
  const decoded = await requireAuth(event);
  const body = await readBody(event);
  
  // Verify password for security
  // ... password verification logic
  
  // Soft delete or hard delete based on policy
  await prisma.$transaction(async (tx) => {
    // Option 1: Soft delete (recommended for 30 days)
    await tx.user.update({
      where: { firebaseUid: decoded.uid },
      data: {
        deletedAt: new Date(),
        email: `deleted_${decoded.uid}@deleted.local`,
        displayName: 'Deleted User'
      }
    });
    
    // Option 2: Hard delete (after grace period)
    // await tx.user.delete({ where: { firebaseUid: decoded.uid } });
    
    // Delete or anonymize related data
    await tx.resume.deleteMany({ where: { userId: decoded.uid } });
    await tx.jobPosting.deleteMany({ where: { userId: decoded.uid } });
    // ... other related data
  });
  
  // Delete Firebase user
  await getAuth().deleteUser(decoded.uid);
  
  return { success: true };
});
```

**Data Handling**:
- **Immediate**: Disable account, revoke all sessions
- **Grace Period** (30 days): Soft delete, allow recovery
- **After Grace Period**: Permanent deletion
- **Anonymization**: Option to anonymize instead of delete

**Features**:
- Password confirmation required
- Data export before deletion (JSON format)
- Grace period with recovery option
- Email confirmation of deletion
- Cascade delete or anonymize related data

**Testing Requirements**:
- Test deletion requires password confirmation
- Test all related data is deleted/anonymized
- Test Firebase user is deleted
- Test recovery during grace period
- Test permanent deletion after grace period

---

## Implementation Priority Matrix

| Enhancement | Priority | Effort | User Impact | Security Impact |
|-------------|----------|--------|-------------|-----------------|
| Password Reset | High | Medium | High | Medium |
| Email Verification | High | Medium | Medium | High |
| User Profile | Medium | Medium | High | Low |
| Session Management | Medium | Low | Medium | Medium |
| MFA | Low | High | Low | High |
| Account Deletion | Low | Medium | Low | High |

## Recommended Implementation Order

### Phase 1: Essential Security (Sprint 1-2)
1. **Password Reset Flow** - Critical for user recovery
2. **Email Verification** - Prevents fake accounts

### Phase 2: User Experience (Sprint 3-4)
3. **User Profile Management** - Improves user engagement
4. **Session Management** - Better security and UX

### Phase 3: Advanced Security (Sprint 5-6)
5. **Multi-Factor Authentication** - For security-conscious users
6. **Account Deletion** - GDPR compliance

## Technical Considerations

### Email Service
- **Current**: Firebase handles email sending
- **Customization**: Can use custom SMTP server
- **Templates**: Customize email templates in Firebase Console
- **Localization**: Support multiple languages

### Database Sync
- Keep Firebase Auth as source of truth
- Sync user data to Prisma database
- Use Firebase Auth webhooks or Cloud Functions
- Handle sync failures gracefully

### Testing Strategy
- Unit tests for all composable methods
- Integration tests for complete flows
- E2E tests with Playwright
- Security testing for auth bypass attempts
- Load testing for concurrent users

### Security Best Practices
- Always re-authenticate for sensitive operations
- Use HTTPS only
- Implement rate limiting on auth endpoints
- Log all authentication events
- Monitor for suspicious activity
- Regular security audits

## Dependencies

### NPM Packages
```json
{
  "dependencies": {
    "firebase": "^10.x.x",
    "firebase-admin": "^12.x.x"
  },
  "devDependencies": {
    "@types/node": "^20.x.x"
  }
}
```

### Environment Variables
```env
# Firebase Client (Public)
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Private)
FIREBASE_SERVICE_ACCOUNT=

# Optional: Custom email SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

### Firebase Console Configuration
- Enable Email/Password provider
- Enable Google OAuth provider
- Configure email templates
- Set up authorized domains
- Configure password requirements

## Migration Strategy

### For Existing Users
1. No breaking changes to current auth flow
2. New features are opt-in
3. Gradual rollout with feature flags
4. Clear communication about new features

### Database Migration
```sql
-- Add new columns to users table
ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) UNIQUE;
ALTER TABLE users ADD COLUMN display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN photo_url TEXT;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN backup_codes TEXT[];
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create index on firebase_uid
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
```

## Success Metrics

### User Engagement
- Reduction in "forgot password" support tickets
- Increase in verified email accounts
- Profile completion rate
- Session duration

### Security
- Reduction in account takeover attempts
- MFA adoption rate
- Failed login attempt rate
- Account recovery success rate

### Compliance
- GDPR data export requests handled
- Account deletion requests processed
- Data retention policy compliance

## Future Enhancements

### Beyond This Plan
- Social login providers (GitHub, Microsoft, Apple)
- Passwordless authentication (magic links)
- Biometric authentication (WebAuthn)
- Single Sign-On (SSO) for enterprise
- Account linking (merge multiple auth methods)
- Security keys (YubiKey, etc.)
- Trusted devices management
- Login notifications and alerts

## References

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [GDPR Compliance Guide](https://gdpr.eu/compliance/)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-15  
**Status**: Proposed  
**Owner**: Development Team
