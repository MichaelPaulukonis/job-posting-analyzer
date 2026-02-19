# Docker Quick Start Guide

## TL;DR - Just Tell Me What To Run

### For Daily Development
```bash
npm run dev:full
```
Opens app at http://localhost:3050 with local database.

### For Running Tests
```bash
npm run test:integration
```
Automatically starts test database, runs tests, you're done.

### For Debugging with Your IDE
```bash
npm run db:local:up    # Start database
npm run dev            # Run app normally
```

---

## Quick Command Reference

### Full Local Development (App + Database)
```bash
npm run dev:full           # Start everything
npm run dev:full:build     # Rebuild and start
npm run dev:full:down      # Stop everything
npm run dev:full:logs      # View logs
```

### Local Database Only
```bash
npm run db:local:up        # Start database
npm run db:local:down      # Stop database
npm run db:local:logs      # View logs
npm run db:local:setup     # Initialize database
```

### Test Database
```bash
npm run test:db:up         # Start test database
npm run test:db:down       # Stop test database
npm run test:integration   # Run tests (auto-starts DB)
```

### App Only (Docker)
```bash
npm run docker:dev         # Development mode
npm run docker:dev:stop    # Stop dev mode
npm run docker:build       # Build production
npm run docker:run         # Run production
npm run docker:stop        # Stop production
```

### AWS RDS Management
```bash
npm run db:rds:status      # Check if RDS is running
npm run db:rds:start       # Start RDS (costs money!)
npm run db:rds:stop        # Stop RDS (save money!)
npm run db:sync:from-rds   # Pull data from RDS
npm run db:sync:to-rds     # Push data to RDS
```

---

## Which Command Should I Use?

| What You're Doing | Command |
|-------------------|---------|
| Starting work for the day | `npm run dev:full` |
| Running tests | `npm run test:integration` |
| Debugging with breakpoints | `npm run db:local:up` then `npm run dev` |
| Testing against AWS | `npm run db:rds:start` then `npm run docker:dev` |
| Checking production build | `npm run docker:build` then `npm run docker:run` |

---

## Ports

- **3050**: Application (all modes)
- **5434**: Local development database
- **5433**: Test database
- **5432**: AWS RDS (not Docker)

---

## Troubleshooting

### "Port already in use"
```bash
npm run dev:full:down
npm run db:local:down
npm run test:db:down
```

### "Can't connect to database"
```bash
# Check if database is running
docker ps | grep postgres

# View database logs
npm run db:local:logs
```

### "Docker build failed"
```bash
# Clean everything and rebuild
docker system prune -a
npm run dev:full:build
```

---

## Cost Reminder

- **Local Docker**: FREE ✅
- **AWS RDS**: ~$0.02/hour when running ⚠️

Always stop RDS when done: `npm run db:rds:stop`

---

For detailed documentation, see [docker-deployment-plan.md](plans/docker-deployment-plan.md)
