# Migration Guide: SQL Scripts → Prisma

This guide explains the transition from manual SQL scripts to Prisma ORM.

## What Changed?

### Before (SQL Scripts Approach)
```
Developer Machine
    ↓ (requires psql installed)
    ↓
AWS RDS PostgreSQL
```

**Problems:**
- Required `psql` installed locally
- Manual script execution
- Hard to automate
- No type safety
- Difficult CI/CD integration

### After (Prisma Approach)
```
Application Code
    ↓ (Prisma Client)
    ↓
AWS RDS PostgreSQL
```

**Benefits:**
- No local database tools needed
- Automatic migrations
- Type-safe database access
- Easy CI/CD integration
- Perfect for Nuxt.js

## File Changes

### Deprecated Files (Keep for Reference)
- `server/database/schema.sql` - Replaced by `prisma/schema.prisma`
- `server/database/connection.js` - Replaced by `server/utils/prisma.ts`
- `scripts/initialize-database.sh` - Replaced by `scripts/initialize-prisma.sh`

### New Files
- `prisma/schema.prisma` - Database schema definition
- `server/utils/prisma.ts` - Prisma Client singleton
- `scripts/initialize-prisma.sh` - Prisma initialization script
- `docs/database/PRISMA_SETUP.md` - Comprehensive Prisma guide

### Updated Files
- `scripts/deploy-database.sh` - Now uses Prisma instead of psql
- `.env.example` - Added DATABASE_URL
- `package.json` - Added Prisma dependencies

## Schema Comparison

### SQL (Old)
```sql
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Prisma (New)
```prisma
model Resume {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  name      String   @db.VarChar(255)
  content   String   @db.Text
  metadata  Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("resumes")
}
```

## Code Migration Examples

### Before: Manual SQL Queries
```javascript
// Old approach with pg library
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// Query
const result = await pool.query(
  'SELECT * FROM resumes WHERE user_id = $1',
  [userId]
)
const resumes = result.rows
```

### After: Prisma Client
```typescript
// New approach with Prisma
import { prisma } from '~/server/utils/prisma'

// Query (type-safe!)
const resumes = await prisma.resume.findMany({
  where: { userId }
})
```

## Migration Steps

### If You Haven't Deployed Yet

1. **Install Prisma** (already done):
   ```bash
   npm install prisma @prisma/client
   ```

2. **Deploy with new script**:
   ```bash
   ./scripts/deploy-database.sh
   ```
   
   This will automatically use Prisma.

### If You Already Have a Database

1. **Backup your data** (if any exists):
   ```bash
   pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup.sql
   ```

2. **Update .env** with DATABASE_URL:
   ```env
   DATABASE_URL="postgresql://dbadmin:password@endpoint:5432/jobanalyzer?schema=public"
   ```

3. **Initialize Prisma**:
   ```bash
   ./scripts/initialize-prisma.sh
   ```

4. **Verify**:
   ```bash
   npx prisma studio
   ```

## Updating Your Code

### 1. Replace Connection Pool

**Before:**
```javascript
// server/database/connection.js
import { Pool } from 'pg'
export const pool = new Pool({ ... })
```

**After:**
```typescript
// server/utils/prisma.ts (already created)
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

### 2. Update API Routes

**Before:**
```javascript
// server/api/resumes/list.get.js
import { pool } from '~/server/database/connection'

export default defineEventHandler(async () => {
  const result = await pool.query('SELECT * FROM resumes')
  return result.rows
})
```

**After:**
```typescript
// server/api/resumes/list.get.ts
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  return await prisma.resume.findMany()
})
```

### 3. Update Queries

| SQL Query | Prisma Equivalent |
|-----------|-------------------|
| `SELECT * FROM resumes` | `prisma.resume.findMany()` |
| `SELECT * FROM resumes WHERE id = $1` | `prisma.resume.findUnique({ where: { id } })` |
| `INSERT INTO resumes ...` | `prisma.resume.create({ data: { ... } })` |
| `UPDATE resumes SET ...` | `prisma.resume.update({ where: { id }, data: { ... } })` |
| `DELETE FROM resumes WHERE id = $1` | `prisma.resume.delete({ where: { id } })` |

## Vector Search Migration

### Before (Raw SQL)
```javascript
const result = await pool.query(`
  SELECT r.id, r.name,
    re.embedding <-> $1::vector AS distance
  FROM resumes r
  JOIN resume_embeddings re ON r.id = re.resume_id
  ORDER BY distance
  LIMIT 10
`, [embedding])
```

### After (Prisma with Raw SQL)
```typescript
const results = await prisma.$queryRaw`
  SELECT r.id, r.name,
    re.embedding <-> ${embedding}::vector AS distance
  FROM resumes r
  JOIN resume_embeddings re ON r.id = re.resume_id
  ORDER BY distance
  LIMIT 10
`
```

Note: pgvector operations still use raw SQL, but through Prisma's `$queryRaw`.

## Testing Your Migration

### 1. Test Database Connection
```bash
npx prisma db execute --stdin <<< "SELECT version();"
```

### 2. Test Prisma Client
```typescript
// test-prisma.ts
import { prisma } from './server/utils/prisma'

async function test() {
  const count = await prisma.resume.count()
  console.log(`Resumes in database: ${count}`)
}

test()
```

### 3. Test API Endpoints
```bash
# Start dev server
npm run dev

# Test endpoint
curl http://localhost:3000/api/resumes/list
```

## Rollback Plan

If you need to rollback to SQL scripts:

1. **Restore from backup**:
   ```bash
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup.sql
   ```

2. **Revert code changes**:
   ```bash
   git checkout HEAD~1 -- server/
   ```

3. **Use old scripts**:
   ```bash
   ./scripts/initialize-database.sh
   ```

## Common Issues

### "PrismaClient is not configured"
```bash
npx prisma generate
```

### "Can't reach database server"
Check your DATABASE_URL in `.env` and security group rules.

### "Table already exists"
Use `npx prisma db push --accept-data-loss` to sync schema.

### Type errors in TypeScript
```bash
npx prisma generate
# Restart your TypeScript server
```

## Benefits Summary

| Aspect | SQL Scripts | Prisma |
|--------|-------------|--------|
| Local tools | psql required | None needed |
| Type safety | None | Full TypeScript |
| Migrations | Manual | Automatic |
| CI/CD | Complex | Simple |
| Developer UX | Command line | Prisma Studio |
| Learning curve | SQL knowledge | Prisma API |
| Nuxt.js integration | Manual | Native |

## Next Steps

1. Read [PRISMA_SETUP.md](./PRISMA_SETUP.md) for detailed usage
2. Explore your database with `npx prisma studio`
3. Start building API endpoints with Prisma Client
4. Set up automated migrations in CI/CD

## Questions?

- Check [Prisma Documentation](https://www.prisma.io/docs)
- Review [PRISMA_SETUP.md](./PRISMA_SETUP.md)
- Test with `npx prisma studio`
