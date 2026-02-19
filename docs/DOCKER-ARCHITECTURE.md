# Docker Architecture Overview

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER DEPLOYMENT SCENARIOS                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO 1: Full Local Development (docker-compose.full.yml)    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │   Nuxt App (Dev)     │◄───────►│  PostgreSQL 15       │     │
│  │   Port: 3050         │         │  + pgvector          │     │
│  │   Hot Reload: ✓      │         │  Port: 5434          │     │
│  │   Volume Mount: ✓    │         │  Persistent: ✓       │     │
│  └──────────────────────┘         └──────────────────────┘     │
│           │                                 │                    │
│           └─────────────┬───────────────────┘                    │
│                         │                                        │
│                  Docker Network                                  │
│                                                                  │
│  Command: npm run dev:full                                      │
│  Use Case: Daily development, no AWS needed                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO 2a: Local Database Only (docker-compose.local.yml)     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │   Nuxt App           │◄───────►│  PostgreSQL 15       │     │
│  │   (Native/Host)      │  5434   │  + pgvector          │     │
│  │   npm run dev        │         │  Port: 5434          │     │
│  │   IDE Debugging: ✓   │         │  Persistent: ✓       │     │
│  └──────────────────────┘         └──────────────────────┘     │
│    (Not in Docker)                    (In Docker)               │
│                                                                  │
│  Commands:                                                       │
│    npm run db:local:up    # Start database                      │
│    npm run dev            # Run app natively                    │
│                                                                  │
│  Use Case: IDE debugging, native app performance                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO 2b: Test Database Only (docker-compose.test.yml)       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │   Jest Tests         │◄───────►│  PostgreSQL 15       │     │
│  │   (Native/Host)      │  5433   │  + pgvector          │     │
│  │   Integration Tests  │         │  Port: 5433          │     │
│  │                      │         │  In-Memory (tmpfs)   │     │
│  └──────────────────────┘         └──────────────────────┘     │
│    (Not in Docker)                    (In Docker)               │
│                                                                  │
│  Command: npm run test:integration                              │
│  Use Case: Fast integration testing, CI/CD                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO 3a: App Dev Mode (docker-compose.dev.yml)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │   Nuxt App (Dev)     │                                       │
│  │   Port: 3050         │         ┌──────────────────────┐     │
│  │   Hot Reload: ✓      │◄───────►│   AWS RDS            │     │
│  │   Volume Mount: ✓    │ Internet│   PostgreSQL 15      │     │
│  └──────────────────────┘         │   Port: 5432         │     │
│      (In Docker)                   └──────────────────────┘     │
│                                        (AWS Cloud)               │
│                                                                  │
│  Commands:                                                       │
│    npm run db:rds:start   # Start RDS (costs money!)            │
│    npm run docker:dev     # Start app                           │
│    npm run db:rds:stop    # Stop RDS (save money!)              │
│                                                                  │
│  Use Case: Testing against production database                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO 3b: App Production (docker-compose.yml)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │   Nuxt App (Prod)    │                                       │
│  │   Port: 3050         │         ┌──────────────────────┐     │
│  │   Optimized Build    │◄───────►│   External Database  │     │
│  │   No Dev Tools       │         │   (RDS/Other)        │     │
│  └──────────────────────┘         └──────────────────────┘     │
│      (In Docker)                                                │
│                                                                  │
│  Commands:                                                       │
│    npm run docker:build   # Build production image              │
│    npm run docker:run     # Start production app                │
│                                                                  │
│  Use Case: Production deployment, performance testing           │
└─────────────────────────────────────────────────────────────────┘
```

## Port Mapping

```
Host Machine                Docker Containers
─────────────               ─────────────────

localhost:3050  ◄──────────► Container Port 3000 (App)
localhost:5434  ◄──────────► Container Port 5432 (Local Dev DB)
localhost:5433  ◄──────────► Container Port 5432 (Test DB)

AWS RDS:
your-rds-endpoint:5432 (Not in Docker, accessed via Internet)
```

## Data Flow

### Full Local Development
```
Browser → localhost:3050 → Docker App Container → Docker DB Container
                                                    (port 5434 from host)
```

### Local Database + Native App
```
Browser → localhost:3001 → Native App Process → Docker DB Container
                                                  (port 5434)
```

### Integration Tests
```
Jest → Test Code → Docker Test DB Container
                   (port 5433)
```

### App with AWS RDS
```
Browser → localhost:3050 → Docker App Container → Internet → AWS RDS
                                                              (port 5432)
```

## Volume Mounts

### Development Mode (Hot Reload)
```
Host: ./                    → Container: /app
Host: (excluded)            → Container: /app/node_modules
Host: (excluded)            → Container: /app/.nuxt
```

### Database Persistence
```
Docker Volume: postgres-dev-data → Container: /var/lib/postgresql/data
```

### Test Database (No Persistence)
```
tmpfs (RAM): /var/lib/postgresql/data
(Data deleted when container stops)
```

## Network Architecture

### docker-compose.full.yml
```
┌─────────────────────────────────────┐
│   job-analyzer-network (bridge)     │
│                                     │
│   ┌─────────────┐  ┌─────────────┐ │
│   │ app         │  │ postgres    │ │
│   │ container   │  │ container   │ │
│   └─────────────┘  └─────────────┘ │
│                                     │
└─────────────────────────────────────┘
         │
         └──► Host: localhost:3050, localhost:5434
```

### Separate Deployments
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ App Network  │     │ Local DB Net │     │ Test DB Net  │
│              │     │              │     │              │
│ ┌──────────┐ │     │ ┌──────────┐ │     │ ┌──────────┐ │
│ │   App    │ │     │ │ Local DB │ │     │ │ Test DB  │ │
│ └──────────┘ │     │ └──────────┘ │     │ └──────────┘ │
└──────────────┘     └──────────────┘     └──────────────┘
      :3050               :5434                 :5433
```

## Decision Flow

```
                    ┌─────────────────┐
                    │  What are you   │
                    │     doing?      │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Daily Dev     │ │ Running      │ │ Debugging    │
    │ Work          │ │ Tests        │ │ with IDE     │
    └───────┬───────┘ └──────┬───────┘ └──────┬───────┘
            │                │                │
            ▼                ▼                ▼
    ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
    │ npm run       │ │ npm run      │ │ db:local:up  │
    │ dev:full      │ │ test:int     │ │ + npm run dev│
    └───────────────┘ └──────────────┘ └──────────────┘
    
            │                │                │
            ▼                ▼                ▼
    ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Scenario 1    │ │ Scenario 2b  │ │ Scenario 2a  │
    │ Full Local    │ │ Test DB      │ │ Local DB     │
    └───────────────┘ └──────────────┘ └──────────────┘
```

## File Dependencies

```
Dockerfile
    ├── Stage: base
    ├── Stage: dev ──────────┬──► docker-compose.dev.yml
    │                        └──► docker-compose.full.yml
    ├── Stage: builder
    └── Stage: production ───────► docker-compose.yml

docker-compose.local.yml ────────► PostgreSQL Image (pgvector/pgvector:pg15)
docker-compose.test.yml ─────────► PostgreSQL Image (pgvector/pgvector:pg15)
docker-compose.full.yml ─────────► Dockerfile (dev) + PostgreSQL Image
```

## Environment Variables Flow

```
.env.local
    ├──► docker-compose.full.yml (via ${VAR})
    ├──► Native app (npm run dev)
    └──► docker-compose.local.yml (via ${VAR})

.env.test
    └──► docker-compose.test.yml (via ${VAR})

.env (or .env.example)
    ├──► docker-compose.yml (via ${VAR})
    └──► docker-compose.dev.yml (via ${VAR})
```

## Quick Reference

| Scenario | Command | App Location | DB Location | Use Case |
|----------|---------|--------------|-------------|----------|
| 1 | `npm run dev:full` | Docker | Docker | Daily dev |
| 2a | `npm run db:local:up` + `npm run dev` | Host | Docker | IDE debugging |
| 2b | `npm run test:integration` | Host | Docker | Testing |
| 3a | `npm run docker:dev` | Docker | AWS RDS | AWS testing |
| 3b | `npm run docker:run` | Docker | External | Production |

---

For detailed documentation, see:
- [docker-deployment-plan.md](plans/docker-deployment-plan.md)
- [DOCKER-QUICK-START.md](DOCKER-QUICK-START.md)
