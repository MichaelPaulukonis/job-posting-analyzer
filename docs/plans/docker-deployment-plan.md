# Docker Deployment Strategy for Job Posting Analyzer

## Overview

This document outlines the complete Docker strategy for the Job Posting Analyzer application. The strategy supports three distinct deployment scenarios, each optimized for different use cases.

## Current Architecture

### Technology Stack
- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Runtime**: Node.js 23 (ESM modules)
- **Database**: PostgreSQL 15 with pgvector extension
- **Package Manager**: npm
- **Build Tool**: Nuxt's built-in Vite-based build system
- **Dependencies**: AI SDKs (Anthropic, Google), PDF.js, TailwindCSS, Prisma

## Three-Tier Docker Strategy

### 1. Full Local Development (App + Database)
**File**: `docker-compose.full.yml`  
**Use Case**: Complete local development without AWS dependencies

**What it includes:**
- Nuxt application (development mode with hot reload)
- PostgreSQL 15 with pgvector (local database)
- Automatic database connection configuration
- Shared Docker network for service communication

**When to use:**
- Daily development work
- Testing database-dependent features locally
- Working offline or without AWS access
- Rapid iteration without cloud costs

**Commands:**
```bash
# Start everything (app + database)
npm run dev:full

# Start with rebuild
npm run dev:full:build

# Stop everything
npm run dev:full:down

# View logs
npm run dev:full:logs
```

**Access:**
- Application: http://localhost:3050
- Database: localhost:5434 (from host machine)
- Database: postgres-dev:5432 (from within Docker network)

**Environment:**
- Uses `.env.local` for configuration
- Database URL: `postgresql://dbadmin:localdevpass@postgres-dev:5432/jobanalyzer?schema=public`

---

### 2. Database-Only Deployments

#### 2a. Local Development Database
**File**: `docker-compose.local.yml`  
**Use Case**: Run database in Docker, app on host machine

**What it includes:**
- PostgreSQL 15 with pgvector only
- Persistent volume for data storage
- Port 5434 exposed to host

**When to use:**
- Running app directly with `npm run dev` (not in Docker)
- Debugging app with full IDE integration
- Need database but want app running natively

**Commands:**
```bash
# Start local database
npm run db:local:up

# Stop local database
npm run db:local:down

# View database logs
npm run db:local:logs

# Setup/initialize database
npm run db:local:setup
```

**Access:**
- Database: localhost:5434
- Connection: `postgresql://dbadmin:localdevpass@localhost:5434/jobanalyzer?schema=public`

#### 2b. Test Database
**File**: `docker-compose.test.yml`  
**Use Case**: Isolated database for integration tests

**What it includes:**
- PostgreSQL 15 with pgvector
- In-memory storage (tmpfs) for speed
- Port 5433 exposed to host
- Separate from development data

**When to use:**
- Running integration tests
- CI/CD pipelines
- Testing database migrations

**Commands:**
```bash
# Start test database
npm run test:db:up

# Stop test database
npm run test:db:down

# View test database logs
npm run test:db:logs

# Run integration tests (starts DB automatically)
npm run test:integration
```

**Access:**
- Database: localhost:5433
- Connection: `postgresql://testuser:testpass@localhost:5433/jobanalyzer_test?schema=public`

---

### 3. App-Only Deployment

#### 3a. Development Mode
**File**: `docker-compose.dev.yml`  
**Use Case**: Run app in Docker, connect to external database (RDS)

**What it includes:**
- Nuxt application (development mode)
- Hot reload with volume mounts
- No database (expects external connection)

**When to use:**
- Testing against AWS RDS database
- Simulating production environment
- Sharing development environment

**Commands:**
```bash
# Start app in development mode
npm run docker:dev

# Stop app
npm run docker:dev:stop
```

**Access:**
- Application: http://localhost:3050
- Database: Configured via `DATABASE_URL` in `.env`

#### 3b. Production Mode
**File**: `docker-compose.yml`  
**Use Case**: Production-ready app deployment

**What it includes:**
- Nuxt application (production build)
- Optimized image size
- Health checks
- No database (expects external connection)

**When to use:**
- Production deployments
- Performance testing
- Final validation before AWS deployment

**Commands:**
```bash
# Build production image
npm run docker:build

# Start production app
npm run docker:run

# Stop production app
npm run docker:stop
```

**Access:**
- Application: http://localhost:3050
- Database: Configured via `DATABASE_URL` in `.env`

---

## Database Management Scripts

### RDS Management (AWS)
```bash
# Start RDS instance (costs money when running)
npm run db:rds:start

# Stop RDS instance (saves money)
npm run db:rds:stop

# Check RDS status
npm run db:rds:status
```

### Data Synchronization
```bash
# Pull data from RDS to local database
npm run db:sync:from-rds

# Push data from local database to RDS
npm run db:sync:to-rds
```

---

## Decision Tree: Which Setup Should I Use?

```
What are you doing?
│
├─ Daily development work
│  └─ Use: npm run dev:full
│     (Full local: app + database)
│
├─ Running integration tests
│  └─ Use: npm run test:integration
│     (Automatically starts test database)
│
├─ Debugging app with IDE
│  ├─ Start: npm run db:local:up
│  └─ Then: npm run dev
│     (Database in Docker, app on host)
│
├─ Testing against AWS RDS
│  ├─ Start: npm run db:rds:start
│  ├─ Configure: DATABASE_URL in .env
│  └─ Run: npm run docker:dev
│     (App in Docker, RDS in AWS)
│
└─ Production deployment testing
   ├─ Build: npm run docker:build
   └─ Run: npm run docker:run
      (Production app, external database)
```

---

## Port Allocation

| Service | Port | Used By |
|---------|------|---------|
| App (all modes) | 3050 | All docker-compose files |
| Local Dev Database | 5434 | docker-compose.local.yml, docker-compose.full.yml |
| Test Database | 5433 | docker-compose.test.yml |
| RDS Database | 5432 | AWS RDS (not Docker) |

---

## Environment Configuration

### .env.local (Full Local Development)
```bash
DATABASE_URL="postgresql://dbadmin:localdevpass@localhost:5434/jobanalyzer?schema=public"
GEMINI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
NUXT_PUBLIC_AUTH_DISABLED=true
```

### .env.test (Integration Tests)
```bash
DATABASE_URL="postgresql://testuser:testpass@localhost:5433/jobanalyzer_test?schema=public"
```

### .env (AWS/Production)
```bash
DATABASE_URL="postgresql://dbadmin:password@rds-endpoint:5432/jobanalyzer?schema=public"
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

---

## Dockerfile Structure

The `Dockerfile` uses multi-stage builds for optimization:

### Stage 1: Base
- Node.js 23 Alpine
- Copies package files

### Stage 2: Development (target: dev)
- Installs all dependencies
- Enables hot reload
- Used by: docker-compose.dev.yml, docker-compose.full.yml

### Stage 3: Builder
- Production dependencies only
- Builds Nuxt application
- Intermediate stage

### Stage 4: Production (target: production)
- Minimal final image
- Only built output and production dependencies
- Used by: docker-compose.yml

---

## Common Workflows

### Starting Fresh Development
```bash
# 1. Start full local environment
npm run dev:full

# 2. Wait for services to be ready
# 3. Access app at http://localhost:3050
```

### Running Tests
```bash
# 1. Start test database
npm run test:db:up

# 2. Run tests
npm run test:integration

# 3. Stop test database
npm run test:db:down
```

### Working with AWS RDS
```bash
# 1. Start RDS instance
npm run db:rds:start

# 2. Check status
npm run db:rds:status

# 3. Pull latest data
npm run db:sync:from-rds

# 4. Work locally
npm run dev:full

# 5. Push changes back
npm run db:sync:to-rds

# 6. Stop RDS to save costs
npm run db:rds:stop
```

### Production Testing
```bash
# 1. Build production image
npm run docker:build

# 2. Start production app
npm run docker:run

# 3. Test at http://localhost:3050

# 4. Stop when done
npm run docker:stop
```

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3050  # or :5434, :5433

# Stop conflicting services
npm run dev:full:down
npm run db:local:down
npm run test:db:down
```

### Database Connection Issues
```bash
# Check database is running
docker ps | grep postgres

# Check database logs
npm run db:local:logs
# or
npm run test:db:logs

# Verify connection string
echo $DATABASE_URL
```

### Docker Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
npm run dev:full:build
```

### Volume Permission Issues
```bash
# Reset volumes
docker-compose -f docker-compose.full.yml down -v
docker-compose -f docker-compose.local.yml down -v
```

---

## Cost Optimization

### Local Development (Free)
- Use `docker-compose.full.yml` for all development
- Only start RDS when needed for testing
- Stop RDS immediately after use

### AWS RDS (Paid)
- Start: `npm run db:rds:start` (costs ~$0.02/hour)
- Stop: `npm run db:rds:stop` (saves money)
- Status: `npm run db:rds:status` (check before starting)

### Best Practice
1. Develop locally with `npm run dev:full` (free)
2. Test against RDS occasionally (minimal cost)
3. Always stop RDS when done: `npm run db:rds:stop`

---

## File Reference

| File | Purpose | Services |
|------|---------|----------|
| `docker-compose.full.yml` | Full local dev | App + Local DB |
| `docker-compose.local.yml` | Database only (dev) | Local DB |
| `docker-compose.test.yml` | Database only (test) | Test DB |
| `docker-compose.dev.yml` | App only (dev mode) | App |
| `docker-compose.yml` | App only (production) | App |
| `Dockerfile` | Multi-stage build | All stages |
| `.dockerignore` | Build exclusions | - |

---

## Summary

The Docker strategy provides flexibility for different development scenarios:

- **Full local development**: Everything in Docker, no AWS needed
- **Hybrid development**: Database in Docker, app on host for debugging
- **Testing**: Isolated test database with in-memory storage
- **Production**: Optimized app container connecting to external database

Choose the setup that matches your current task, and use the decision tree above to guide your choice.
