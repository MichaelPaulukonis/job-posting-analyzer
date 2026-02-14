# Prisma Database Setup Guide

This project uses **Prisma ORM** for database management, which is the industry standard for Node.js/TypeScript applications. This approach eliminates the need for local database tools like `psql` and provides type-safe database access.

## Why Prisma?

- ✅ **No local database tools required** - Everything runs from your application
- ✅ **Type-safe database access** - Full TypeScript support
- ✅ **Automatic migrations** - Version-controlled schema changes
- ✅ **Perfect for Nuxt.js** - Seamless integration with server API routes
- ✅ **Easy CI/CD** - Migrations run from application code
- ✅ **Developer-friendly** - Prisma Studio for visual database management

## Architecture

```
Application Code → Prisma Client → AWS RDS PostgreSQL
                                    ↓
                              pgvector extension
                              uuid-ossp extension
```

## Quick Start

### 1. Deploy RDS Infrastructure

```bash
./scripts/deploy-database.sh
```

This script will:
1. Deploy RDS PostgreSQL via CloudFormation
2. Configure security groups
3. Set up DATABASE_URL in `.env`
4. Run Prisma migrations automatically

### 2. Verify Setup

```bash
# View your database in a web UI
npx prisma studio

# Check database connection
npx prisma db execute --stdin <<< "SELECT version();"
```

## Database Schema

The schema is defined in `prisma/schema.prisma` and includes:

### Tables
- **users** - User accounts (for future multi-user support)
- **resumes** - Resume documents and content
- **resume_embeddings** - Vector embeddings for semantic search (1536 dimensions)
- **job_postings** - Job posting documents
- **job_posting_embeddings** - Vector embeddings for job postings
- **analysis_results** - Resume vs job posting analysis results
- **cover_letters** - Generated cover letters
- **conversations** - Chat history

### Features
- UUID primary keys (using uuid-ossp extension)
- Vector embeddings (using pgvector extension)
- Automatic timestamps (created_at, updated_at)
- Proper foreign key relationships
- Indexes for performance

## Using Prisma in Your Code

### Import the Prisma Client

```typescript
// In any server file (server/api/*.ts, server/utils/*.ts, etc.)
import { prisma } from '~/server/utils/prisma'
```

### Example: Create a Resume

```typescript
// server/api/resumes/create.post.ts
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const resume = await prisma.resume.create({
    data: {
      name: body.name,
      content: body.content,
      metadata: body.metadata || {},
    }
  })
  
  return resume
})
```

### Example: Query with Relations

```typescript
// Get resume with all analysis results
const resume = await prisma.resume.findUnique({
  where: { id: resumeId },
  include: {
    analysisResults: {
      include: {
        jobPosting: true
      }
    },
    embeddings: true
  }
})
```

### Example: Vector Search

```typescript
// Find similar resumes using pgvector
const similarResumes = await prisma.$queryRaw`
  SELECT 
    r.id, 
    r.name,
    re.embedding <-> ${jobEmbedding}::vector AS distance
  FROM resumes r
  JOIN resume_embeddings re ON r.id = re.resume_id
  ORDER BY distance
  LIMIT 10
`
```

## Schema Changes

### Making Changes to the Schema

1. Edit `prisma/schema.prisma`
2. Generate migration:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
3. Commit the migration files to git

### Applying Migrations

Development:
```bash
npx prisma migrate dev
```

Production:
```bash
npx prisma migrate deploy
```

## Common Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Push schema to database (development only)
npx prisma db push

# Create a migration
npx prisma migrate dev --name add_new_field

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (visual database editor)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Validate schema
npx prisma validate

# Format schema file
npx prisma format
```

## Environment Variables

Add to your `.env` file:

```env
DATABASE_URL="postgresql://dbadmin:your_password@your_rds_endpoint:5432/jobanalyzer?schema=public"
```

The `deploy-database.sh` script automatically sets this up for you.

## Troubleshooting

### Connection Issues

```bash
# Test database connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Schema Out of Sync

```bash
# Reset and reapply schema
npx prisma migrate reset
npx prisma migrate deploy
```

### Regenerate Client

```bash
# If you get "PrismaClient is not configured" errors
npx prisma generate
```

## Migration from SQL Scripts

The old approach used manual SQL scripts with `psql`. The new Prisma approach:

| Old Approach | New Approach |
|--------------|--------------|
| `psql` required locally | No local tools needed |
| Manual SQL scripts | Prisma schema + migrations |
| `server/database/schema.sql` | `prisma/schema.prisma` |
| `scripts/initialize-database.sh` | `npx prisma db push` |
| Manual connection pooling | Built into Prisma |

## Production Deployment

### App Runner / Docker

Add to your Dockerfile:

```dockerfile
# Generate Prisma Client
RUN npx prisma generate

# Run migrations on startup
CMD npx prisma migrate deploy && node .output/server/index.mjs
```

### Environment Variables

Ensure `DATABASE_URL` is set in your production environment (App Runner, Lambda, etc.)

## Best Practices

1. **Always use Prisma Client** - Don't write raw SQL unless necessary
2. **Use transactions** for multi-step operations
3. **Include relations** only when needed (avoid N+1 queries)
4. **Use connection pooling** in production (Prisma handles this)
5. **Version control migrations** - Commit all migration files
6. **Test migrations** in staging before production

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma with Nuxt.js](https://www.prisma.io/docs/guides/other/nuxtjs)
- [pgvector with Prisma](https://www.prisma.io/docs/guides/database/using-pgvector)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## Support

If you encounter issues:
1. Check the [Prisma documentation](https://www.prisma.io/docs)
2. Run `npx prisma validate` to check schema
3. Check database connectivity with `npx prisma db execute`
4. Review CloudFormation stack status in AWS Console
