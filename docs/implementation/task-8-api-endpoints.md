# Task 8: API Endpoints Implementation

## Overview
Implemented all required Nitro API routes for user profile, resumes, job postings, and analysis using Prisma ORM for database operations.

## Implementation Date
February 15, 2026

## Endpoints Implemented

### Authentication Endpoints

#### POST /api/auth/profile
- **Purpose**: Update authenticated user's profile
- **Authentication**: Required (Firebase JWT)
- **Request Body**:
  ```typescript
  {
    name: string  // Required
  }
  ```
- **Response**:
  ```typescript
  {
    user: {
      id: string
      firebaseUid: string
      email: string
      name: string
      createdAt: Date
      updatedAt: Date
    }
  }
  ```
- **Validation**: Name must be a non-empty string
- **File**: `server/api/auth/profile.post.ts`

#### GET /api/auth/profile
- **Purpose**: Get authenticated user's profile
- **Authentication**: Required (Firebase JWT)
- **File**: `server/api/auth/profile.get.ts` (already existed)

### Resume Endpoints

#### POST /api/resumes
- **Purpose**: Create a new resume
- **Authentication**: Required
- **Request Body**:
  ```typescript
  {
    name: string        // Required
    content: string     // Required
    metadata?: object   // Optional
  }
  ```
- **Response**: Resume object with all fields
- **Validation**:
  - Name must be a non-empty string
  - Content must be a non-empty string
- **File**: `server/api/resumes/index.post.ts`

#### GET /api/resumes
- **Purpose**: List all resumes for authenticated user
- **Authentication**: Required
- **Query Parameters**:
  - `limit`: number (default: 50, max: 100)
  - `offset`: number (default: 0)
  - `name`: string (optional filter, case-insensitive)
- **Response**:
  ```typescript
  {
    resumes: Resume[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
  ```
- **File**: `server/api/resumes/index.get.ts`

#### GET /api/resumes/:id
- **Purpose**: Get a specific resume by ID
- **Authentication**: Required
- **Response**: Resume object or 404 if not found/not owned by user
- **File**: `server/api/resumes/[id].ts` (updated)

#### DELETE /api/resumes/:id
- **Purpose**: Delete a specific resume
- **Authentication**: Required
- **Response**: `{ success: true }` or 404
- **Cascade**: Automatically deletes related analysis results
- **File**: `server/api/resumes/[id].ts` (updated)

### Job Posting Endpoints

#### POST /api/job-postings
- **Purpose**: Create a new job posting
- **Authentication**: Required
- **Request Body**:
  ```typescript
  {
    title: string           // Required
    company?: string        // Optional
    content: string         // Required
    url?: string            // Optional
    location?: string       // Optional
    salaryRange?: string    // Optional
    metadata?: object       // Optional
  }
  ```
- **Response**: JobPosting object with all fields
- **Validation**:
  - Title must be a non-empty string
  - Content must be a non-empty string
- **File**: `server/api/job-postings/index.post.ts`

#### GET /api/job-postings
- **Purpose**: List all job postings for authenticated user
- **Authentication**: Required
- **Query Parameters**:
  - `limit`: number (default: 50, max: 100)
  - `offset`: number (default: 0)
  - `company`: string (optional filter, case-insensitive)
- **Response**:
  ```typescript
  {
    jobPostings: JobPosting[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
  ```
- **File**: `server/api/job-postings/index.get.ts`

### Analysis Endpoints

#### POST /api/analysis
- **Purpose**: Create a new analysis result
- **Authentication**: Required
- **Request Body**:
  ```typescript
  {
    resumeId: string              // Required (UUID)
    jobPostingId: string          // Required (UUID)
    matches: string[]             // Optional (default: [])
    gaps: string[]                // Optional (default: [])
    suggestions: string[]         // Optional (default: [])
    similarityScore?: number      // Optional (0-1)
    analysisMetadata?: object     // Optional
  }
  ```
- **Response**: AnalysisResult object with resume and job posting details
- **Validation**:
  - Resume must exist and belong to user
  - Job posting must exist and belong to user
- **File**: `server/api/analysis/index.post.ts`

#### GET /api/analysis
- **Purpose**: List all analysis results for authenticated user
- **Authentication**: Required
- **Query Parameters**:
  - `limit`: number (default: 50, max: 100)
  - `offset`: number (default: 0)
  - `resumeId`: string (optional filter)
  - `jobPostingId`: string (optional filter)
- **Response**:
  ```typescript
  {
    analysisResults: AnalysisResult[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
  ```
- **File**: `server/api/analysis/index.get.ts`

#### GET /api/analysis/:id
- **Purpose**: Get a specific analysis result by ID
- **Authentication**: Required
- **Response**: AnalysisResult with full resume and job posting details
- **File**: `server/api/analysis/[id].get.ts`

## Key Implementation Details

### Database Access
- All endpoints use Prisma ORM (not raw SQL as shown in task examples)
- Leverages existing Prisma client singleton at `server/utils/prisma.ts`
- Type-safe queries with full TypeScript support
- Automatic connection pooling and error handling

### Authentication
- All endpoints use `requireAuth` middleware from `server/utils/verifyToken.ts`
- Automatically syncs Firebase users to database
- Returns both user object and decoded Firebase token
- Enforces user ownership for all resources

### Validation
- Input validation at API layer
- Required fields checked before database operations
- Type checking for all inputs
- Proper error messages with 400 status codes

### Error Handling
- 400: Bad Request (validation errors)
- 404: Not Found (resource doesn't exist or doesn't belong to user)
- 500: Internal Server Error (unexpected errors)
- All errors use Nuxt's `createError` utility

### Pagination
- Consistent pagination across all list endpoints
- Default limit: 50, maximum: 100
- Returns total count and hasMore flag
- Offset-based pagination for simplicity

### Security
- All endpoints require authentication
- User ownership verified for all operations
- No cross-user data access possible
- Firebase JWT validation on every request

## Testing

### Integration Tests Created
1. `tests/server/api/auth/profile.integration.test.ts`
   - GET and POST profile endpoints
   - Profile update validation
   - Timestamp updates

2. `tests/server/api/resumes.integration.test.ts`
   - CRUD operations for resumes
   - Pagination and filtering
   - Cascade delete verification
   - Validation tests

3. `tests/server/api/job-postings.integration.test.ts`
   - Create and list job postings
   - Company filtering
   - Pagination support
   - Validation tests

4. `tests/server/api/analysis.integration.test.ts`
   - Create analysis results
   - List and filter analyses
   - Full detail retrieval
   - Metadata storage
   - Foreign key validation

### Test Configuration Note
Integration tests require a test database connection. Add `DATABASE_URL` to `.env.test` to run integration tests:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/server/api/resumes.integration.test.ts

# Run with coverage
npm test -- --coverage
```

## Migration from File Storage

### Old Implementation
- Used `ResumeRepository` with file-based storage
- Stored data in JSON files
- No user association
- No relationships between entities

### New Implementation
- Uses Prisma with PostgreSQL
- Proper relational database structure
- User ownership for all resources
- Foreign key constraints and cascade deletes
- Type-safe queries

### Breaking Changes
- Resume endpoints now require authentication
- Response format includes pagination metadata
- IDs are UUIDs instead of simple strings
- Metadata is stored as JSON in database

## Files Created/Modified

### Created
- `server/api/auth/profile.post.ts`
- `server/api/resumes/index.post.ts`
- `server/api/resumes/index.get.ts`
- `server/api/job-postings/` (directory)
- `server/api/job-postings/index.post.ts`
- `server/api/job-postings/index.get.ts`
- `server/api/analysis/` (directory)
- `server/api/analysis/index.post.ts`
- `server/api/analysis/index.get.ts`
- `server/api/analysis/[id].get.ts`
- `tests/server/api/auth/profile.integration.test.ts`
- `tests/server/api/resumes.integration.test.ts`
- `tests/server/api/job-postings.integration.test.ts`
- `tests/server/api/analysis.integration.test.ts`
- `docs/implementation/task-8-api-endpoints.md` (this file)

### Modified
- `server/api/resumes/[id].ts` - Updated to use Prisma instead of file repository

## Next Steps (Task 9)
- Update frontend components to use new API endpoints
- Implement file upload to S3 with pre-signed URLs
- Create API client composable (`useApi`)
- Add loading states and error handling
- Create history view for past analyses
- Update authentication flow integration

## References
- [Prisma Documentation](https://www.prisma.io/docs)
- [Nuxt Server Routes](https://nuxt.com/docs/guide/directory-structure/server)
- [H3 Event Handlers](https://h3.unjs.io/)
- Task 5: Database Service Implementation
- Task 7: Firebase Auth Integration
