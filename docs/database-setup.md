# Database Setup Guide

Quick guide for setting up and using the local development database.

## TL;DR - Get Started in 2 Minutes

```bash
# 1. Set up local database (one-time)
npm run db:local:setup

# 2. Use local database for development
cp .env.local .env

# 3. Start developing
npm run dev
```

That's it! You now have a free, fast local PostgreSQL database with pgvector.

---

## Three Database Environments

### 1. 🏠 Local Dev (Recommended for Daily Work)
- **Port:** 5432
- **Cost:** $0/month
- **Speed:** Instant startup
- **Use for:** Daily development, fast iteration

```bash
npm run db:local:up      # Start
npm run db:local:down    # Stop
npm run db:local:logs    # View logs
```

### 2. 🧪 Local Test (Automatic)
- **Port:** 5433
- **Cost:** $0/month
- **Speed:** Instant startup
- **Use for:** Integration tests only

```bash
npm run test:db:up       # Start
npm run test:integration # Run tests
npm run test:db:down     # Stop
```

### 3. ☁️ RDS Production (AWS Learning)
- **Port:** 5432 (remote)
- **Cost:** $2.30/month (stopped), $12-15/month (running)
- **Speed:** 2-3 minutes to start
- **Use for:** AWS learning, demos, production

```bash
npm run db:rds:start     # Start (2-3 min)
npm run db:rds:stop      # Stop (5-10 min)
npm run db:rds:status    # Check status
```

---

## Common Workflows

### Daily Development (Free & Fast)

```bash
# One-time setup
npm run db:local:setup
cp .env.local .env

# Daily use
npm run db:local:up
npm run dev
# ... develop ...
npm run db:local:down
```

**Cost:** $0  
**Startup:** Instant

---

### Work with Production Data

```bash
# Pull RDS data to local
npm run db:rds:start        # Start RDS (2-3 min)
npm run db:sync:from-rds    # Sync data
npm run db:rds:stop         # Stop RDS to save $

# Now develop locally with real data
npm run dev
```

**Cost:** ~$0.50 (one-time RDS start)  
**Benefit:** Work with real data locally

---

### Test AWS Integration

```bash
# Use RDS directly
npm run db:rds:start
cp .env .env.backup
# .env already points to RDS
npm run dev
# ... test AWS features ...
npm run db:rds:stop
```

**Cost:** ~$0.50/day while testing  
**Benefit:** Test real AWS integration

---

### Push Local Changes to RDS

```bash
# ⚠️ Use with caution - replaces RDS data
npm run db:rds:start
npm run db:sync:to-rds
npm run db:rds:stop
```

**Use when:** Deploying tested local changes

---

## Environment Files

### For Local Development (Recommended)
```bash
# Use .env.local
DATABASE_URL="postgresql://dbadmin:localdevpass@localhost:5432/jobanalyzer"
```

### For RDS/Production
```bash
# Use .env
DATABASE_URL="postgresql://dbadmin:Mongoworlion123@job-analyzer-postgres...rds.amazonaws.com:5432/jobanalyzer"
```

### Quick Switch
```bash
# Switch to local
cp .env.local .env

# Switch to RDS
git checkout .env  # Restore original
```

---

## NPM Scripts Reference

### Local Database
```bash
npm run db:local:setup      # Initial setup (one-time)
npm run db:local:up         # Start local database
npm run db:local:down       # Stop local database
npm run db:local:logs       # View database logs
```

### Data Sync
```bash
npm run db:sync:from-rds    # Pull RDS → Local
npm run db:sync:to-rds      # Push Local → RDS (⚠️ caution)
```

### RDS Management
```bash
npm run db:rds:start        # Start RDS instance
npm run db:rds:stop         # Stop RDS instance
npm run db:rds:status       # Check RDS status
```

### Test Database
```bash
npm run test:db:up          # Start test database
npm run test:db:down        # Stop test database
npm run test:db:logs        # View test database logs
```

---

## Troubleshooting

### "Port 5432 already in use"
```bash
# Check what's using the port
lsof -i :5432

# Stop local database
npm run db:local:down

# Or stop system PostgreSQL
brew services stop postgresql@15
```

### "Cannot connect to database"
```bash
# Check if database is running
docker ps | grep job-analyzer

# Restart local database
npm run db:local:down
npm run db:local:up

# Check logs
npm run db:local:logs
```

### "Prisma migrations fail"
```bash
# Reset local database
npm run db:local:down
docker volume rm job-posting-analyzer_postgres-dev-data
npm run db:local:setup
```

### "RDS connection timeout"
```bash
# Check RDS status
npm run db:rds:status

# Ensure RDS is running
npm run db:rds:start

# Check AWS credentials
aws sts get-caller-identity
```

---

## Cost Comparison

| Workflow | Monthly Cost | Startup Time |
|----------|--------------|--------------|
| Local only | $0 | Instant |
| Local + occasional RDS sync | ~$2-5 | Instant (local) |
| RDS always-on | $12-15 | 2-3 min |
| Hybrid (local dev, RDS demos) | ~$2-8 | Instant (local) |

**Recommendation:** Use local for daily work, RDS for AWS learning and demos.

---

## Data Persistence

### Local Dev Database
- Data stored in Docker volume: `postgres-dev-data`
- Persists across restarts
- Delete with: `docker volume rm job-posting-analyzer_postgres-dev-data`

### Test Database
- Data stored in memory (tmpfs)
- Deleted when stopped
- Fresh database for each test run

### RDS
- Data stored in AWS EBS
- Persists when stopped
- Billed for storage (~$2.30/month)

---

## Security Notes

- Local databases use simple passwords (fine for local dev)
- RDS password in `.env` (consider AWS Secrets Manager for production)
- Backup files contain real data (excluded from git via `.gitignore`)
- Test database is ephemeral (no sensitive data)

---

## Next Steps

1. **Set up local database:** `npm run db:local:setup`
2. **Switch to local env:** `cp .env.local .env`
3. **Start developing:** `npm run dev`
4. **Read full docs:** [scripts/db/README.md](../scripts/db/README.md)

---

## Related Documentation

- [Database Scripts README](../scripts/db/README.md) - Detailed script documentation
- [Cost-Conscious Cloud](.kiro/steering/cost-conscious-cloud.md) - Cost optimization guidelines
- [Task 10.1 Implementation](implementation/task-10.1-aurora-migration.md) - Migration details
