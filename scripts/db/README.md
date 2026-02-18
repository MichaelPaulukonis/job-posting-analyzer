# Database Management Scripts

Scripts for managing local development and RDS databases.

## Quick Start

### First Time Setup

```bash
# Set up local development database
./scripts/db/setup-local.sh

# Copy local env to main env (or use .env.local directly)
cp .env.local .env
```

## Database Environments

### 1. Local Dev Database (Port 5434)
- **Purpose**: Daily development work
- **Connection**: `postgresql://dbadmin:localdevpass@localhost:5434/jobanalyzer`
- **Cost**: Free
- **Data**: Can sync with RDS or use independently

### 2. Local Test Database (Port 5433)
- **Purpose**: Integration tests only
- **Connection**: `postgresql://testuser:testpass@localhost:5433/jobanalyzer_test`
- **Cost**: Free
- **Data**: Isolated, ephemeral (uses tmpfs)

### 3. RDS Production (Remote)
- **Purpose**: Production/demo environment
- **Connection**: Via AWS RDS endpoint
- **Cost**: $2.30/month (stopped), $12-15/month (running)
- **Data**: Production data, sync occasionally

## Available Scripts

### Local Database Management

#### `setup-local.sh`
Initial setup for local development database.

```bash
./scripts/db/setup-local.sh
```

**What it does:**
- Starts local PostgreSQL with pgvector
- Runs Prisma migrations
- Generates Prisma client
- Creates empty database ready for development

**When to use:** First time setup, or after deleting local database

---

#### `sync-from-rds.sh`
Pull data FROM RDS TO local dev database.

```bash
./scripts/db/sync-from-rds.sh
```

**What it does:**
1. Checks RDS is running (starts if needed)
2. Dumps RDS data to backup file
3. Replaces local database with RDS data
4. Runs Prisma migrations

**When to use:**
- Want to work with production data locally
- Testing migrations against real data
- After making changes in RDS

**Requirements:**
- RDS must be running (script will prompt to start)
- Local database must be running

---

#### `sync-to-rds.sh`
Push data FROM local TO RDS (⚠️ Use with caution).

```bash
./scripts/db/sync-to-rds.sh
```

**What it does:**
1. Backs up current RDS data (safety)
2. Dumps local data
3. Replaces RDS data with local data

**When to use:**
- Deploying tested changes to production
- Migrating local development to RDS
- Rare - usually develop locally, test, then deploy app

**⚠️ Warning:** This REPLACES all RDS data!

---

### RDS Management

#### `start-rds.sh`
Start the RDS instance.

```bash
./scripts/db/start-rds.sh
```

**Timing:** 2-3 minutes to start  
**Cost:** Starts billing at ~$0.50/day

---

#### `stop-rds.sh`
Stop the RDS instance to save costs.

```bash
./scripts/db/stop-rds.sh
```

**Timing:** 5-10 minutes to fully stop  
**Cost:** Reduces to ~$2.30/month (storage only)  
**Note:** AWS auto-restarts after 7 days

---

#### `status-rds.sh`
Check current RDS status.

```bash
./scripts/db/status-rds.sh
```

**Shows:**
- Current status (available, stopped, stopping, starting)
- Endpoint and port
- Last status change timestamp

---

## Common Workflows

### Daily Development (Local Only)

```bash
# Start local database
docker-compose -f docker-compose.local.yml up -d

# Develop with .env.local
npm run dev

# Stop when done
docker-compose -f docker-compose.local.yml down
```

**Cost:** $0/month  
**Speed:** Instant startup

---

### Development with Production Data

```bash
# 1. Start RDS (if stopped)
./scripts/db/start-rds.sh

# 2. Sync data to local
./scripts/db/sync-from-rds.sh

# 3. Stop RDS to save costs
./scripts/db/stop-rds.sh

# 4. Develop locally with real data
npm run dev

# 5. When ready to deploy, sync back (optional)
./scripts/db/start-rds.sh
./scripts/db/sync-to-rds.sh
```

---

### Testing AWS Integration

```bash
# Start RDS
./scripts/db/start-rds.sh

# Use .env (points to RDS)
npm run dev

# Test AWS features...

# Stop RDS when done
./scripts/db/stop-rds.sh
```

---

### Running Tests

```bash
# Start test database
npm run test:db:up

# Run integration tests
npm run test:integration

# Stop test database
npm run test:db:down
```

**Note:** Test database is separate (port 5433) and doesn't affect dev or RDS.

---

## Environment Files

### `.env` (RDS - Production)
```bash
DATABASE_URL="postgresql://dbadmin:Mongoworlion123@job-analyzer-postgres...rds.amazonaws.com:5432/jobanalyzer"
```

**Use for:**
- Testing AWS integration
- Deploying to production
- Occasional RDS work

---

### `.env.local` (Local Dev)
```bash
DATABASE_URL="postgresql://dbadmin:localdevpass@localhost:5432/jobanalyzer"
```

**Use for:**
- Daily development
- Fast iteration
- Cost-free development

---

### `.env.test` (Test Database)
```bash
DATABASE_URL="postgresql://testuser:testpass@localhost:5433/jobanalyzer_test"
```

**Use for:**
- Integration tests only
- Automatically used by test scripts

---

## Docker Commands

### Local Dev Database

```bash
# Start
docker-compose -f docker-compose.local.yml up -d

# Stop (keeps data)
docker-compose -f docker-compose.local.yml down

# Stop and delete data
docker-compose -f docker-compose.local.yml down -v

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Access psql
docker exec -it job-analyzer-dev-db psql -U dbadmin -d jobanalyzer
```

### Test Database

```bash
# Start
npm run test:db:up

# Stop
npm run test:db:down

# View logs
npm run test:db:logs
```

---

## Data Backup Location

All database dumps are saved to:
```
.data/db-backups/
├── rds-dump-YYYYMMDD_HHMMSS.sql
├── local-dump-YYYYMMDD_HHMMSS.sql
└── rds-backup-before-sync-YYYYMMDD_HHMMSS.sql
```

**Note:** This directory is in `.gitignore` (contains real data)

---

## Troubleshooting

### Local database won't start
```bash
# Check if port 5432 is in use
lsof -i :5432

# Stop any existing containers
docker-compose -f docker-compose.local.yml down

# Remove volume and start fresh
docker-compose -f docker-compose.local.yml down -v
./scripts/db/setup-local.sh
```

### RDS connection fails
```bash
# Check RDS status
./scripts/db/status-rds.sh

# Ensure RDS is running
./scripts/db/start-rds.sh

# Check AWS credentials
aws sts get-caller-identity
```

### Prisma migrations fail
```bash
# Reset local database
docker-compose -f docker-compose.local.yml down -v
./scripts/db/setup-local.sh

# Or reset Prisma
npx prisma migrate reset
```

### Sync scripts fail
```bash
# Ensure pg_dump and psql are installed
which pg_dump
which psql

# Install if missing (macOS)
brew install postgresql@15

# Ensure databases are running
docker ps  # Check local
./scripts/db/status-rds.sh  # Check RDS
```

---

## Cost Summary

| Environment | Running Cost | Stopped Cost | Startup Time |
|-------------|--------------|--------------|--------------|
| Local Dev | $0/month | $0/month | Instant |
| Local Test | $0/month | $0/month | Instant |
| RDS | $12-15/month | $2.30/month | 2-3 minutes |

**Recommendation:** Use local dev for daily work, RDS for AWS learning and demos.

---

## Security Notes

- Local databases use simple passwords (fine for local dev)
- RDS password is in `.env` (should use Secrets Manager in production)
- Backup files contain real data (excluded from git)
- Test database uses tmpfs (data deleted on stop)

---

## Related Documentation

- [Cost-Conscious Cloud](.kiro/steering/cost-conscious-cloud.md)
- [Infrastructure as Code](.kiro/steering/infrastructure-as-code.md)
- [Task 10.1 Implementation](../../docs/implementation/task-10.1-aurora-migration.md)
