# JSON to PostgreSQL Migration Guide

## Overview

This guide explains how to migrate existing JSON data from the `.data/` directory to the PostgreSQL database using Prisma ORM.

## What Gets Migrated

The migration script handles four JSON files:

1. **resumes.json** → `resumes` table
2. **analysis-history.json** → `job_postings` and `analysis_results` tables
3. **conversations.json** → `conversations` table
4. **cover-letter-samples.json** → Stored as metadata (reference samples)

## Prerequisites

Before running the migration:

1. **Database must be deployed and accessible**
   ```bash
   # Verify DATABASE_URL is set
   grep DATABASE_URL .env
   
   # Test connection
   npx prisma db execute --stdin <<< "SELECT version();"
   ```

2. **Prisma Client must be generated**
   ```bash
   npx prisma generate
   ```

3. **Database schema must be applied**
   ```bash
   npx prisma db push
   ```

## Migration Process

### Step 1: Backup JSON Files

The script automatically creates backups before migration:

```bash
.data/backup/
├── resumes.json.1234567890.bak
├── analysis-history.json.1234567890.bak
├── conversations.json.1234567890.bak
└── cover-letter-samples.json.1234567890.bak
```

### Step 2: Run Migration

```bash
npm run migrate:json
```

Or directly:

```bash
tsx scripts/migrate-json-to-db.ts
```

### Step 3: Verify Migration

The script automatically verifies record counts. You can also check manually:

```bash
# Open Prisma Studio
npx prisma studio

# Or query directly
npx prisma db execute --stdin <<< "
SELECT 
  (SELECT COUNT(*) FROM resumes) as resumes,
  (SELECT COUNT(*) FROM job_postings) as job_postings,
  (SELECT COUNT(*) FROM analysis_results) as analyses,
  (SELECT COUNT(*) FROM conversations) as conversations;
"
```

## Data Mapping

### Resumes

```typescript
// JSON structure
{
  "id": "resume-1769810107666",
  "name": "01.30 python",
  "content": "Michael Paulukonis...",
  "timestamp": "2026-01-30T21:55:07.666Z"
}

// Maps to Prisma
{
  id: "resume-1769810107666",
  name: "01.30 python",
  content: "Michael Paulukonis...",
  metadata: {
    source: "json_migration",
    originalTimestamp: "2026-01-30T21:55:07.666Z"
  },
  createdAt: new Date("2026-01-30T21:55:07.666Z"),
  updatedAt: new Date("2026-01-30T21:55:07.666Z")
}
```

### Analysis History

```typescript
// JSON structure
{
  "id": "2208dfef-ff73-449b-a6cd-3cd6699553fd",
  "matches": ["TypeScript", "React", "Node.js"],
  "gaps": ["GCP"],
  "suggestions": ["Add GCP experience..."],
  "timestamp": "2026-02-07T02:01:42.951Z",
  "jobTitle": "Senior Backend Engineer",
  "jobPosting": {
    "title": "Senior Backend Engineer",
    "content": "Job description..."
  },
  "resume": {
    "content": "Resume content..."
  }
}

// Maps to:
// 1. job_postings table
{
  id: "2208dfef-ff73-449b-a6cd-3cd6699553fd-job",
  title: "Senior Backend Engineer",
  content: "Job description...",
  metadata: {
    source: "json_migration",
    originalAnalysisId: "2208dfef-ff73-449b-a6cd-3cd6699553fd"
  }
}

// 2. analysis_results table
{
  id: "2208dfef-ff73-449b-a6cd-3cd6699553fd",
  resumeId: "<matched-resume-id>",
  jobPostingId: "2208dfef-ff73-449b-a6cd-3cd6699553fd-job",
  matches: ["TypeScript", "React", "Node.js"],
  gaps: ["GCP"],
  suggestions: ["Add GCP experience..."],
  analysisMetadata: {
    source: "json_migration",
    originalTimestamp: "2026-02-07T02:01:42.951Z",
    jobTitle: "Senior Backend Engineer"
  }
}
```

### Conversations

```typescript
// JSON structure
{
  "id": "conv-1769810241745-ae443b69l",
  "analysisId": "fbc47db8-4d71-48c4-baeb-596fed0a3a8a",
  "messages": [
    {
      "role": "system",
      "content": "You are a professional cover letter writer...",
      "timestamp": "2026-01-30T21:57:21.745Z"
    }
  ],
  "currentContent": "# Cover Letter\n\n...",
  "createdAt": "2026-01-30T21:57:21.745Z",
  "updatedAt": "2026-01-30T21:57:28.899Z"
}

// Maps to
{
  id: "conv-1769810241745-ae443b69l",
  messages: [...],
  metadata: {
    source: "json_migration",
    currentContent: "# Cover Letter\n\n...",
    analysisId: "fbc47db8-4d71-48c4-baeb-596fed0a3a8a"
  },
  resumeId: "<from-linked-analysis>",
  jobPostingId: "<from-linked-analysis>",
  createdAt: new Date("2026-01-30T21:57:21.745Z"),
  updatedAt: new Date("2026-01-30T21:57:28.899Z")
}
```

## Features

### Transaction-Based

All migrations run in a single database transaction. If any step fails, the entire migration rolls back, leaving the database unchanged.

### Idempotent

The script uses `upsert` operations, so you can run it multiple times safely. Existing records will be updated, not duplicated.

### Data Validation

- Validates JSON structure before insertion
- Handles missing or malformed data gracefully
- Logs errors for individual records without stopping the entire migration

### Referential Integrity

- Automatically links conversations to their analysis results
- Links analysis results to resumes and job postings
- Maintains foreign key relationships

## Troubleshooting

### Migration Fails with "Database not found"

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Verify database exists
npx prisma db execute --stdin <<< "SELECT current_database();"
```

### Migration Fails with "Table does not exist"

```bash
# Apply schema
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### Some Records Not Migrated

Check the console output for specific error messages. Common issues:

1. **Invalid UUIDs**: The script generates new UUIDs if needed
2. **Missing relationships**: Resume content matching may fail if content has changed
3. **Duplicate IDs**: Use `upsert` to handle duplicates

### Rollback Migration

If you need to start over:

```bash
# Clear all data (DESTRUCTIVE!)
npx prisma db execute --stdin <<< "
TRUNCATE TABLE conversations CASCADE;
TRUNCATE TABLE analysis_results CASCADE;
TRUNCATE TABLE job_postings CASCADE;
TRUNCATE TABLE resumes CASCADE;
"

# Restore from backup
cp .data/backup/resumes.json.*.bak .data/resumes.json
cp .data/backup/analysis-history.json.*.bak .data/analysis-history.json
cp .data/backup/conversations.json.*.bak .data/conversations.json
cp .data/backup/cover-letter-samples.json.*.bak .data/cover-letter-samples.json

# Re-run migration
npm run migrate:json
```

## Post-Migration

### Update Application Code

After successful migration, update your application to use Prisma instead of JSON files:

```typescript
// Before (JSON)
import { readFile } from 'fs/promises'
const resumes = JSON.parse(await readFile('.data/resumes.json', 'utf-8'))

// After (Prisma)
import { prisma } from '~/server/utils/prisma'
const resumes = await prisma.resume.findMany()
```

### Verify Data Integrity

```bash
# Check record counts match
npm run migrate:json  # Shows counts at end

# Spot check data
npx prisma studio
```

### Archive JSON Files

Once you've verified the migration:

```bash
# Move JSON files to archive
mkdir -p .data/archive
mv .data/*.json .data/archive/

# Keep backups for safety
# Don't delete .data/backup/
```

## Performance

Migration performance depends on data volume:

- **Small datasets** (< 100 records): < 1 second
- **Medium datasets** (100-1000 records): 1-5 seconds
- **Large datasets** (1000+ records): 5-30 seconds

The script uses batch operations where possible for optimal performance.

## Safety Features

1. **Automatic Backups**: All JSON files backed up before migration
2. **Transaction Rollback**: Database unchanged if migration fails
3. **Idempotent Operations**: Safe to run multiple times
4. **Error Logging**: Detailed error messages for debugging
5. **Verification Step**: Automatic record count verification

## Next Steps

After successful migration:

1. ✅ Verify data in Prisma Studio
2. ✅ Update application code to use Prisma
3. ✅ Test application functionality
4. ✅ Archive JSON files
5. ✅ Update deployment scripts if needed

## Related Documentation

- [Prisma Setup Guide](./PRISMA_SETUP.md)
- [Database README](./README.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
