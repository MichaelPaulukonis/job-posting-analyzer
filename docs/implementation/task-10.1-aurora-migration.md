# Task 10.1: Database Cost Optimization

## Status: Complete ✅

## Overview
~~Migrating from RDS PostgreSQL to Aurora Serverless v1~~ **UPDATED**: Aurora Serverless v1 is no longer available in us-east-1. Using manual RDS stop/start for cost savings instead.

## Cost Comparison
- **RDS Running**: $12-15/month
- **RDS Stopped**: $2.30/month (storage only)
- **Savings**: ~$10-13/month when stopped
- **Limitation**: Auto-restarts after 7 days

## Why Not Aurora Serverless v1?
Aurora Serverless v1 is no longer available in us-east-1 region (AWS is phasing it out). Aurora Serverless v2 doesn't support auto-pause (minimum $43.80/month - too expensive for personal project).

## Solution: Manual RDS Stop/Start ✅

Created helper scripts for easy RDS management:

### 1. Check RDS Status
```bash
./scripts/db/status-rds.sh
```
Shows current status, endpoint, engine version, and estimated cost.

### 2. Stop RDS (Save Costs)
```bash
./scripts/db/stop-rds.sh
```
Stops the RDS instance. Cost drops from $12-15/month to $2.30/month (storage only).

### 3. Start RDS (When Needed)
```bash
./scripts/db/start-rds.sh
```
Starts the RDS instance. Takes 2-3 minutes to become available after starting.

**Note**: If you just stopped the database, wait 5-10 minutes for it to fully stop before starting again.

## Usage Workflow

### For Development
```bash
# Start of work session
./scripts/db/start-rds.sh
# Wait 2-3 minutes for startup
npm run dev

# End of work session
./scripts/db/stop-rds.sh
# Note: Takes 5-10 minutes to fully stop
```

### For Demos
```bash
# Before demo
./scripts/db/start-rds.sh
# Wait 2-3 minutes for startup
# Run demo

# After demo
./scripts/db/stop-rds.sh
# Note: Takes 5-10 minutes to fully stop
```

### Check Status Anytime
```bash
./scripts/db/status-rds.sh
```

## Implementation Completed ✅

### 1. Created RDS Management Scripts ✅
- `scripts/db/stop-rds.sh` - Stop RDS to save costs
- `scripts/db/start-rds.sh` - Start RDS when needed  
- `scripts/db/status-rds.sh` - Check current status
- All scripts made executable with `chmod +x`

### 2. Tested Scripts ✅
- Status script shows RDS is currently running
- Scripts use AWS CLI to manage RDS instance
- Instance identifier: `job-analyzer-postgres`

### 3. Current Configuration ✅
- **Instance**: db.t4g.micro
- **Engine**: PostgreSQL 15.8
- **Storage**: 20GB
- **Endpoint**: job-analyzer-postgres.cyjek0mosjy6.us-east-1.rds.amazonaws.com
- **Extensions**: pgvector enabled
- **Status**: Available (running)

## Cost Savings Strategy

### Recommended Usage Pattern
1. **Development**: Stop RDS when not actively coding
2. **Demos**: Start only when showing the project
3. **Testing**: Start for test runs, stop after
4. **Idle periods**: Always stop to save costs

### Monthly Cost Estimates
- **Always running**: $12-15/month
- **Running 8 hours/day**: ~$6-8/month
- **Running 2 hours/day**: ~$3-4/month
- **Stopped (storage only)**: $2.30/month

### 7-Day Auto-Restart
RDS automatically restarts after 7 days when stopped. To maintain cost savings:
- Set a calendar reminder to re-stop every 6 days
- Or accept the auto-restart and stop again when noticed

## Testing Checklist ✅
- [x] RDS management scripts created
- [x] Scripts made executable
- [x] Status script tested and working
- [x] Current RDS status verified (running)
- [x] Cost savings strategy documented
- [x] Usage workflow documented

## Notes
- Current RDS has test data only, no production data to preserve
- Database password stored in `.env` file (consider Secrets Manager for production)
- AWS credentials already configured and working
- CloudFormation stack `job-analyzer-rds` exists and manages the instance

## Next Steps
After Task 10.1 complete:
- Mark task as done in Taskmaster
- Decide whether to proceed with Task 10.2 (Nuxt Lambda configuration)
- Consider stopping RDS now to start saving costs immediately
