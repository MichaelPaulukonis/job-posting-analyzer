# Incident Report: Test Database Data Loss

## Date: February 15, 2026

## Severity: CRITICAL

## Summary
Production database data was accidentally deleted during integration test development. All tables except `conversations` were cleared.

## Root Cause
The integration test setup file (`tests/setup.ts`) contains an `afterEach` hook that deletes all test data:

```typescript
afterEach(async () => {
  await cleanupTestData();
});
```

This cleanup function deletes data from ALL tables. If the tests accidentally connect to the production database instead of the test database, this results in production data loss.

## What Happened
1. Integration tests were being developed with Docker PostgreSQL test database
2. The `.env.test` file was not being loaded properly by Jest
3. Tests ran against production AWS RDS database (from `.env`)
4. The `afterEach` cleanup hook deleted all production data

## Data Recovery
✅ Data was successfully restored from JSON backup files using `npm run migrate:json`

**Restored:**
- 7 resumes
- 5 job postings  
- 7 analysis results
- 21 conversations (were not deleted)

## Preventive Measures Implemented

### 1. Database URL Safety Checks
Added critical safety checks in both `tests/setup.ts` and `tests/globalSetup.ts`:

```typescript
// CRITICAL SAFETY CHECK: Ensure we're connected to test database
const DATABASE_URL = process.env.DATABASE_URL || '';
if (!DATABASE_URL.includes('localhost:5433') && !DATABASE_URL.includes('jobanalyzer_test')) {
  throw new Error(
    `❌ SAFETY CHECK FAILED: Tests must use test database!\n` +
    `Current DATABASE_URL: ${DATABASE_URL}\n` +
    `Expected: localhost:5433 or jobanalyzer_test database\n` +
    `This prevents accidental data loss in production database.`
  );
}
```

### 2. Force Environment Variable Loading
Updated `tests/globalSetup.ts` to explicitly override environment variables:

```typescript
const testEnv = config({ path: '.env.test', override: true });
process.env.DATABASE_URL = testEnv.parsed.DATABASE_URL;
```

### 3. Docker Image Update
Changed from `postgres:15-alpine` to `pgvector/pgvector:pg15` to support the vector extension required by the schema.

### 4. Documentation
- Updated `docs/fixes/test-database-setup.md` with complete implementation details
- Created this incident report for future reference

## Testing the Safety Checks

To verify the safety checks work:

```bash
# This should FAIL with safety check error
DATABASE_URL="postgresql://production..." npm run test:integration

# This should PASS
npm run test:integration  # Uses .env.test automatically
```

## Lessons Learned

1. **Always validate database connections in tests** - Never assume environment variables are loaded correctly
2. **Fail fast with clear errors** - The safety check now prevents accidental production database access
3. **Keep backups** - The JSON backup files saved us from permanent data loss
4. **Test isolation is critical** - Tests must never touch production data under any circumstances

## Action Items

- [x] Restore production data from backups
- [x] Add database URL safety checks
- [x] Force .env.test loading in globalSetup
- [x] Update Docker image to support pgvector
- [x] Document incident and preventive measures
- [ ] Consider additional safeguards (e.g., separate AWS accounts for test/prod)
- [ ] Review all test files for similar risks

## Related Files
- `tests/setup.ts` - Test setup with safety checks
- `tests/globalSetup.ts` - Global setup with forced env loading
- `docker-compose.test.yml` - Docker PostgreSQL configuration
- `.env.test` - Test database configuration
- `docs/fixes/test-database-setup.md` - Complete setup documentation

## Prevention Checklist

Before running integration tests:
- [ ] Verify `.env.test` exists and points to localhost:5433
- [ ] Check that Docker container is running (`docker ps`)
- [ ] Confirm safety checks are in place in test files
- [ ] Never run tests with production DATABASE_URL in environment

## Emergency Recovery Procedure

If production data is accidentally deleted:

1. **Stop all tests immediately**
2. **Check JSON backup files** in `.data/` and `.data/backup/`
3. **Run migration script**: `npm run migrate:json`
4. **Verify data restoration** in Prisma Studio
5. **Document the incident**
6. **Review and strengthen safety measures**

## Contact
For questions about this incident or the preventive measures, refer to this document and the related files listed above.
