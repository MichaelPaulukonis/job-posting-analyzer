# Task 6: S3 Service Implementation

**Status**: ✅ Complete  
**Date**: February 14, 2026

## Overview

Implemented a comprehensive S3 service layer for handling file storage operations in the Job Posting Analyzer application. The service provides type-safe, error-handled methods for all S3 operations with proper security validations.

## Implementation Details

### S3 Service (`server/services/S3Service.ts`)

A singleton service class that wraps AWS SDK v3 S3 operations with:

**Core Features**:
- File upload (direct and pre-signed URLs)
- File download (direct and pre-signed URLs)
- File deletion (single and batch)
- File metadata retrieval
- File existence checking
- Directory listing
- Automatic UUID generation for file keys
- Folder structure management

**Security Features**:
- Path traversal prevention
- Input validation
- Error handling with detailed logging
- Environment variable validation

**Methods Implemented**:
1. `uploadFile(buffer, options)` - Direct file upload
2. `createPresignedUploadUrl(options)` - Generate pre-signed upload URL
3. `createPresignedDownloadUrl(key, expiresIn)` - Generate pre-signed download URL
4. `getPublicUrl(key)` - Get public URL (for reference)
5. `downloadFile(key)` - Direct file download
6. `deleteFile(key)` - Delete single file
7. `deleteFiles(keys)` - Batch delete files
8. `fileExists(key)` - Check file existence
9. `getFileInfo(key)` - Get file metadata
10. `listFiles(folder, maxKeys)` - List files in folder

### API Endpoints

Created 5 RESTful API endpoints for S3 operations:

#### 1. POST `/api/files/upload-url`
Generate pre-signed URL for client-side uploads.

**Request**:
```json
{
  "folder": "resumes",
  "fileName": "resume.pdf",
  "contentType": "application/pdf",
  "expiresIn": 3600
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "key": "resumes/resume.pdf"
  }
}
```

#### 2. POST `/api/files/download-url`
Generate pre-signed URL for file downloads.

**Request**:
```json
{
  "key": "resumes/resume.pdf",
  "expiresIn": 3600
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://..."
  }
}
```

#### 3. GET `/api/files/:key`
Get file metadata.

**Response**:
```json
{
  "success": true,
  "data": {
    "key": "resumes/resume.pdf",
    "size": 102400,
    "lastModified": "2024-02-14T...",
    "contentType": "application/pdf",
    "metadata": {}
  }
}
```

#### 4. DELETE `/api/files/:key`
Delete a file.

**Response**:
```json
{
  "success": true
}
```

#### 5. GET `/api/files/list`
List files in a folder.

**Query Params**:
- `folder` (optional): Folder prefix
- `maxKeys` (optional): Max results (1-1000, default 1000)

**Response**:
```json
{
  "success": true,
  "data": {
    "files": ["resumes/file1.pdf", "resumes/file2.pdf"]
  }
}
```

### Security Validations

All API endpoints include:
- Path traversal prevention (`..` detection)
- Input validation
- Error handling with appropriate HTTP status codes
- URL encoding/decoding for file keys

### Testing

Comprehensive test suite with 18 tests covering:
- Service initialization
- File upload operations
- Pre-signed URL generation
- File deletion
- File existence checking
- File metadata retrieval
- Directory listing
- Error handling
- Edge cases

**Test Results**: ✅ All 18 tests passing

## Files Created

### Service Layer
- `server/services/S3Service.ts` - Main S3 service implementation

### API Endpoints
- `server/api/files/upload-url.post.ts` - Pre-signed upload URL generation
- `server/api/files/download-url.post.ts` - Pre-signed download URL generation
- `server/api/files/[key].get.ts` - File metadata retrieval
- `server/api/files/[key].delete.ts` - File deletion
- `server/api/files/list.get.ts` - Directory listing

### Tests
- `tests/services/S3Service.test.ts` - Comprehensive test suite

### Documentation
- `docs/implementation/task-6-s3-service.md` - This file

## Dependencies Added

```json
{
  "@aws-sdk/client-s3": "^3.x",
  "@aws-sdk/s3-request-presigner": "^3.x"
}
```

## Environment Variables Required

```bash
S3_BUCKET_NAME=job-analyzer-files
AWS_REGION=us-east-1
# AWS credentials loaded automatically from environment or IAM role
```

## Usage Examples

### Server-Side Direct Upload

```typescript
import s3Service from '~/server/services/S3Service'

// Upload a file
const buffer = Buffer.from(fileContent)
const key = await s3Service.uploadFile(buffer, {
  folder: 'resumes',
  fileName: 'resume.pdf',
  contentType: 'application/pdf'
})
```

### Client-Side Upload Flow

```typescript
// 1. Get pre-signed URL from API
const response = await $fetch('/api/files/upload-url', {
  method: 'POST',
  body: {
    folder: 'resumes',
    fileName: 'resume.pdf',
    contentType: 'application/pdf'
  }
})

// 2. Upload directly to S3 from client
await fetch(response.data.url, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': 'application/pdf'
  }
})

// 3. Use the key for database storage
const fileKey = response.data.key
```

### Download File

```typescript
// Get pre-signed download URL
const response = await $fetch('/api/files/download-url', {
  method: 'POST',
  body: {
    key: 'resumes/resume.pdf'
  }
})

// Use URL to download file
window.open(response.data.url)
```

## Integration Points

The S3 service is ready to be integrated with:
1. Resume upload functionality
2. Job posting document storage
3. Cover letter generation and storage
4. Analysis result attachments
5. User profile pictures (future)

## Next Steps

1. ✅ S3 service implemented and tested
2. ⏭️ Integrate with resume upload UI (future task)
3. ⏭️ Integrate with job posting document storage (future task)
4. ⏭️ Add file type validation and size limits in UI
5. ⏭️ Implement file cleanup for deleted records

## Performance Considerations

- Pre-signed URLs enable direct client-to-S3 uploads, reducing server load
- Batch operations for multiple file deletions
- Configurable expiration times for pre-signed URLs
- Efficient streaming for file downloads

## Security Considerations

- ✅ Path traversal prevention
- ✅ Input validation on all endpoints
- ✅ Pre-signed URLs with expiration
- ✅ Bucket configured with public access blocked
- ✅ IAM role-based access control
- ⚠️ CORS configuration allows all origins (should be restricted in production)

## Monitoring and Logging

All operations include:
- Success logging with file keys
- Error logging with detailed messages
- Service initialization logging

## Cost Optimization

- Pre-signed URLs reduce data transfer through application server
- Lifecycle rules configured in S3 bucket (90-day version deletion)
- Efficient batch operations for multiple files

## Conclusion

Task 6 is complete. The S3 service provides a robust, secure, and well-tested foundation for file storage operations in the application. All tests pass, and the service is ready for integration with the frontend.
