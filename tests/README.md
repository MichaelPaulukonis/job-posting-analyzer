# Testing Guide

This project uses Jest for testing with separate configurations for unit and integration tests.

## Test Types

### Unit Tests
- **Location**: `tests/**/*.test.ts` (excluding `*.integration.test.ts`)
- **Purpose**: Test individual functions, classes, and modules in isolation
- **Database**: Uses mocks, no real database connection
- **Speed**: Fast (milliseconds)

### Integration Tests
- **Location**: `tests/**/*.integration.test.ts`
- **Purpose**: Test API endpoints and database interactions
- **Database**: Uses Docker PostgreSQL on port 5433
- **Speed**: Slower (seconds) due to database operations

## Running Tests

### Unit Tests Only (Default)
```bash
npm test
# or
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### All Tests
```bash
npm run test:all
```

## Integration Test Setup

Integration tests use a Docker PostgreSQL container that is automatically managed:

1. **Automatic Setup**: `globalSetup.ts` starts Docker and runs migrations
2. **Test Isolation**: Each test gets a clean database via `afterEach` cleanup
3. **Automatic Teardown**: `globalTeardown.ts` stops Docker after all tests

### Manual Docker Management

If you need to manually manage the test database:

```bash
# Start test database
npm run test:db:up

# View logs
npm run test:db:logs

# Stop test database
npm run test:db:down
```

## Test Database Configuration

- **Host**: localhost
- **Port**: 5433 (to avoid conflicts with local PostgreSQL on 5432)
- **Database**: jobanalyzer_test
- **User**: testuser
- **Password**: testpass
- **Storage**: tmpfs (in-memory for speed)

Configuration is in:
- `docker-compose.test.yml` - Docker setup
- `.env.test` - Environment variables

## Writing Tests

### Unit Test Example

```typescript
// tests/services/MyService.test.ts
import { MyService } from '~/services/MyService';

describe('MyService', () => {
  it('should do something', () => {
    const service = new MyService();
    expect(service.doSomething()).toBe('expected');
  });
});
```

### Integration Test Example

```typescript
// tests/server/api/myEndpoint.integration.test.ts
import { prisma } from '~/server/utils/prisma';
import { createTestUser, createTestResume } from '../setup';

describe('My API Endpoint', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create test data
    testUser = await createTestUser();
  });

  it('should return data', async () => {
    const resume = await createTestResume(testUser.id);
    
    // Test your endpoint
    const result = await prisma.resume.findFirst({
      where: { id: resume.id }
    });
    
    expect(result).toBeDefined();
    expect(result?.userId).toBe(testUser.id);
  });
  
  // Cleanup happens automatically via afterEach in setup.ts
});
```

## Test Helpers

The `tests/setup.ts` file provides helper functions for creating test data:

- `createTestUser(userData?)` - Create a test user with unique ID/email
- `createTestResume(userId, data?)` - Create a test resume
- `createTestJobPosting(data?)` - Create a test job posting
- `createTestAnalysis(resumeId, jobPostingId, data?)` - Create a test analysis
- `cleanupTestData()` - Clean all test data (called automatically)

## Test Isolation

Each integration test runs in isolation:

1. **Before Test**: Database is clean (via `afterEach` from previous test)
2. **During Test**: Test creates its own data using helpers
3. **After Test**: `afterEach` cleans up all data

This ensures:
- Tests don't interfere with each other
- Tests can run in any order
- Tests are repeatable and deterministic

## Troubleshooting

### Docker Not Starting

```bash
# Check if Docker is running
docker ps

# Check test database logs
npm run test:db:logs

# Manually stop and restart
npm run test:db:down
npm run test:db:up
```

### Port 5433 Already in Use

```bash
# Find what's using the port
lsof -i :5433

# Kill the process or change port in docker-compose.test.yml
```

### Migrations Not Running

```bash
# Manually run migrations on test database
DATABASE_URL="postgresql://testuser:testpass@localhost:5433/jobanalyzer_test?schema=public" npx prisma migrate deploy
```

### Tests Hanging

- Check if Docker container is running: `docker ps`
- Check database logs: `npm run test:db:logs`
- Ensure no other process is using port 5433

### Clean Slate

```bash
# Stop everything and start fresh
npm run test:db:down
docker system prune -f
npm run test:integration
```

## CI/CD Integration

For CI/CD pipelines, the test setup automatically:
1. Starts Docker PostgreSQL
2. Runs migrations
3. Executes tests
4. Stops Docker PostgreSQL

No manual setup required!

## Best Practices

1. **Use Test Helpers**: Always use `createTestUser()`, etc. for consistent data
2. **Unique IDs**: Test helpers generate unique IDs to avoid conflicts
3. **No Manual Cleanup**: Let `afterEach` handle cleanup automatically
4. **Test Isolation**: Don't rely on data from other tests
5. **Descriptive Names**: Use clear test descriptions
6. **Fast Tests**: Keep integration tests focused and fast

## Performance

- **Unit Tests**: ~100ms for entire suite
- **Integration Tests**: ~5-10s for entire suite
- **Docker Startup**: ~5s (one-time cost)
- **Per Test**: ~50-200ms (with database operations)

The tmpfs storage makes database operations very fast!
