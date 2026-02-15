# Test Database Setup

## Issue
Integration tests are failing (23 out of 151 tests) because:
1. Tests are running against the production AWS RDS PostgreSQL database
2. Tests try to create users that already exist in production
3. Tests try to delete users that don't exist (cleanup fails)
4. No separate test database configuration exists

## Test Failures Summary
- **Resumes API**: 9 tests failing
- **Job Postings API**: 5 tests failing  
- **Analysis API**: 4 tests failing
- **Auth Profile API**: 5 tests failing

## Root Cause
The tests use the same `DATABASE_URL` from `.env` that points to the production database:
```
DATABASE_URL="postgresql://dbadmin:Mongoworlion123@job-analyzer-postgres.cyjek0mosjy6.us-east-1.rds.amazonaws.com:5432/jobanalyzer?schema=public"
```

## Solutions

### Option 1: Use SQLite for Tests (Recommended for Local Development)
Create a separate test database using SQLite that's fast and doesn't require AWS access.

**Pros:**
- Fast test execution
- No AWS costs
- Easy to reset between test runs
- Works offline

**Cons:**
- SQLite has some differences from PostgreSQL
- May not catch PostgreSQL-specific issues

**Implementation:**

1. Install SQLite Prisma client:
```bash
npm install -D @prisma/client
```

2. Create test-specific Prisma schema (`prisma/schema.test.prisma`):
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./test.db"
}

// Copy all models from schema.prisma
```

3. Update test setup to use SQLite:
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
});

beforeAll(async () => {
  // Run migrations
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
});

afterAll(async () => {
  // Clean up
  await prisma.$disconnect();
});
```

### Option 2: Use Separate PostgreSQL Test Database (Recommended for CI/CD)
Create a separate test database on AWS RDS or use a local PostgreSQL instance.

**Pros:**
- Tests run against same database type as production
- Catches PostgreSQL-specific issues
- More realistic testing environment

**Cons:**
- Slower than SQLite
- Requires AWS access or local PostgreSQL setup
- May incur AWS costs

**Implementation:**

1. Create test database on AWS RDS:
```bash
# Option A: Create new database in same RDS instance
psql -h job-analyzer-postgres.cyjek0mosjy6.us-east-1.rds.amazonaws.com \
     -U dbadmin -d postgres \
     -c "CREATE DATABASE jobanalyzer_test;"
```

2. Add test database URL to `.env.test`:
```env
DATABASE_URL="postgresql://dbadmin:Mongoworlion123@job-analyzer-postgres.cyjek0mosjy6.us-east-1.rds.amazonaws.com:5432/jobanalyzer_test?schema=public"
```

3. Update test configuration to use `.env.test`:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig({
  test: {
    env: loadEnv('test', process.cwd(), ''),
    setupFiles: ['./tests/setup.ts']
  }
});
```

### Option 3: Use Docker PostgreSQL for Tests
Run PostgreSQL in a Docker container for tests.

**Pros:**
- Isolated test environment
- Fast to reset
- No AWS costs
- Works offline

**Cons:**
- Requires Docker installed
- Slightly slower than SQLite

**Implementation:**

1. Create `docker-compose.test.yml`:
```yaml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: jobanalyzer_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data
```

2. Update `.env.test`:
```env
DATABASE_URL="postgresql://testuser:testpass@localhost:5433/jobanalyzer_test?schema=public"
```

3. Add test scripts to `package.json`:
```json
{
  "scripts": {
    "test:db:up": "docker-compose -f docker-compose.test.yml up -d",
    "test:db:down": "docker-compose -f docker-compose.test.yml down",
    "test:integration": "npm run test:db:up && vitest run && npm run test:db:down"
  }
}
```

## Immediate Fix: Update Tests for Auth-Disabled Mode

While setting up a test database, we can fix the immediate issue by updating tests to work with auth-disabled mode:

### Fix 1: Update Test User Creation
Instead of using `upsert`, check if user exists first:

```typescript
// tests/server/api/resumes.integration.test.ts
beforeEach(async () => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: mockUser.id }
  });

  if (!existingUser) {
    // Only create if doesn't exist
    await prisma.user.create({
      data: {
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
});
```

### Fix 2: Update Test Cleanup
Handle cleanup errors gracefully:

```typescript
afterAll(async () => {
  try {
    // Clean up test data
    await prisma.resume.deleteMany({
      where: { userId: mockUser.id }
    });
    
    // Only delete user if we created it
    const user = await prisma.user.findUnique({
      where: { id: mockUser.id }
    });
    
    if (user) {
      await prisma.user.delete({
        where: { id: mockUser.id }
      });
    }
  } catch (error) {
    console.error('Cleanup error:', error);
    // Don't fail tests on cleanup errors
  }
});
```

### Fix 3: Use Unique Test User IDs
Generate unique user IDs for each test run to avoid conflicts:

```typescript
const mockUser = {
  id: `test-user-${Date.now()}`,
  email: `test-${Date.now()}@example.com`,
  displayName: 'Test User'
};
```

## Recommended Approach

For immediate fix:
1. ✅ Update tests to handle existing users gracefully
2. ✅ Use unique test user IDs
3. ✅ Handle cleanup errors gracefully

For long-term solution:
1. Set up Docker PostgreSQL for local testing (Option 3)
2. Use separate AWS RDS test database for CI/CD (Option 2)
3. Update CI/CD pipeline to use test database

## Implementation Steps

### Step 1: Create Test Environment File
```bash
cp .env .env.test
```

Edit `.env.test` to use test database URL.

### Step 2: Update Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    env: {
      ...config({ path: '.env.test' }).parsed
    }
  }
});
```

### Step 3: Update Test Setup
```typescript
// tests/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/utils/prisma';

beforeAll(async () => {
  // Run migrations on test database
  console.log('Setting up test database...');
  // Add any test-specific setup here
});

afterAll(async () => {
  // Clean up test database
  console.log('Cleaning up test database...');
  await prisma.$disconnect();
});
```

### Step 4: Update Integration Tests
Apply the fixes mentioned above to all integration test files:
- `tests/server/api/resumes.integration.test.ts`
- `tests/server/api/job-postings.integration.test.ts`
- `tests/server/api/analysis.integration.test.ts`
- `tests/server/api/auth/profile.integration.test.ts`

## Testing the Fix

1. Set up test database (choose one option above)
2. Run migrations on test database:
```bash
DATABASE_URL="<test-db-url>" npx prisma migrate deploy
```

3. Run tests:
```bash
npm test
```

4. Verify all tests pass:
```bash
npm test -- --reporter=verbose
```

## Related Files
- `.env` - Production database configuration
- `.env.test` - Test database configuration (to be created)
- `vitest.config.ts` - Test configuration
- `tests/setup.ts` - Test setup and teardown
- `tests/server/api/*.integration.test.ts` - Integration tests

## Security Note
Never commit `.env.test` with real credentials to version control. Add it to `.gitignore`.
