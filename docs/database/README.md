# Database Documentation

This directory contains documentation for the job-posting-analyzer database setup and management.

## Quick Links

- **[Prisma Setup Guide](./PRISMA_SETUP.md)** - Complete guide to using Prisma ORM
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Transitioning from SQL scripts to Prisma

## Overview

This project uses **Prisma ORM** with **PostgreSQL** (AWS RDS) for data persistence. The database includes:

- User management
- Resume storage and analysis
- Job posting management
- Vector embeddings for semantic search (pgvector)
- Analysis results and cover letter generation
- Chat conversation history

## Quick Start

```bash
# Deploy database infrastructure and schema
./scripts/deploy-database.sh

# View database in browser
npx prisma studio

# Use in your code
import { prisma } from '~/server/utils/prisma'
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Nuxt.js Application             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Prisma Client                │ │
│  │  (Type-safe database access)      │ │
│  └───────────────┬───────────────────┘ │
└──────────────────┼─────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   AWS RDS           │
         │   PostgreSQL 15.8   │
         │                     │
         │  Extensions:        │
         │  - uuid-ossp        │
         │  - pgvector         │
         └─────────────────────┘
```

## Database Schema

### Core Tables

1. **users** - User accounts
2. **resumes** - Resume documents
3. **job_postings** - Job postings
4. **analysis_results** - Resume/job analysis
5. **cover_letters** - Generated cover letters
6. **conversations** - Chat history

### Vector Search Tables

1. **resume_embeddings** - Resume vector embeddings (1536 dimensions)
2. **job_posting_embeddings** - Job posting vector embeddings

## Key Features

### 1. Type-Safe Database Access

```typescript
// Fully typed queries
const resume = await prisma.resume.findUnique({
  where: { id: resumeId },
  include: { analysisResults: true }
})
```

### 2. Automatic Migrations

```bash
# Create migration
npx prisma migrate dev --name add_new_field

# Apply in production
npx prisma migrate deploy
```

### 3. Vector Search

```typescript
// Semantic search with pgvector
const similar = await prisma.$queryRaw`
  SELECT * FROM resumes r
  JOIN resume_embeddings re ON r.id = re.resume_id
  ORDER BY re.embedding <-> ${queryEmbedding}::vector
  LIMIT 10
`
```

### 4. Visual Database Management

```bash
# Open Prisma Studio
npx prisma studio
```

## File Structure

```
project/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── migrations/            # Version-controlled migrations
├── server/
│   └── utils/
│       └── prisma.ts          # Prisma Client singleton
├── scripts/
│   ├── deploy-database.sh     # Full deployment script
│   └── initialize-prisma.sh   # Prisma-only initialization
└── docs/
    └── database/
        ├── README.md          # This file
        ├── PRISMA_SETUP.md    # Detailed Prisma guide
        └── MIGRATION_GUIDE.md # SQL → Prisma migration
```

## Common Tasks

### Deploy New Database

```bash
./scripts/deploy-database.sh
```

### Update Schema

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_change`
3. Commit migration files

### Query Database

```typescript
// In any server file
import { prisma } from '~/server/utils/prisma'

const resumes = await prisma.resume.findMany()
```

### View Data

```bash
npx prisma studio
```

### Reset Database (Development)

```bash
npx prisma migrate reset
```

## Environment Variables

Required in `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

The `deploy-database.sh` script sets this up automatically.

## Infrastructure

### CloudFormation Resources

- RDS PostgreSQL instance (db.t4g.micro)
- VPC with 2 subnets across AZs
- Security group with configurable access
- Parameter group for pgvector support

### Configuration

- Engine: PostgreSQL 15.8
- Storage: 20GB gp3 (encrypted)
- Backups: 7-day retention
- Multi-AZ: Disabled (cost optimization)
- Public access: Enabled (development)

## Best Practices

1. **Always use Prisma Client** - Avoid raw SQL unless necessary
2. **Use transactions** for multi-step operations
3. **Include relations selectively** - Prevent N+1 queries
4. **Version control migrations** - Commit all migration files
5. **Test in staging** before production deployment

## Troubleshooting

### Connection Issues

```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1;"

# Check security group rules in AWS Console
```

### Schema Sync Issues

```bash
# Push schema without migration
npx prisma db push

# Or reset and reapply
npx prisma migrate reset
```

### Type Generation Issues

```bash
# Regenerate Prisma Client
npx prisma generate
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)

## Support

For detailed information:
- See [PRISMA_SETUP.md](./PRISMA_SETUP.md) for usage guide
- See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for migration help
- Check [Prisma Docs](https://www.prisma.io/docs) for API reference
