# Migration Plan: RDS PostgreSQL to Aurora Serverless v1

## Overview
Migrate from RDS PostgreSQL (db.t4g.micro) to Aurora Serverless v1 with auto-pause to reduce costs from ~$12-15/month to ~$2-16/month depending on usage.

## Why Aurora Serverless v1?

### Cost Comparison
- **Current RDS**: $12-15/month (always running) + $2.30/month storage when stopped
- **Aurora Serverless v1**: 
  - Active: $0.06/hour (~$43/month if 24/7)
  - **Auto-pauses after 5 min idle**: $0/hour
  - Storage: ~$0.10/GB-month (~$2/month for 20GB)
  - **Realistic cost**: $2-16/month for intermittent development

### Key Features
- ✅ **Auto-pause**: Pauses after 5 minutes of inactivity (configurable 1-7 days)
- ✅ **Auto-resume**: Wakes up in ~30 seconds on first connection
- ✅ **pgvector support**: Full PostgreSQL compatibility
- ✅ **Automatic backups**: 1-35 day retention
- ✅ **Scaling**: Can scale capacity units based on load
- ✅ **Perfect for demos**: Warn users about 30-second cold start

## Current State Assessment

### Existing Resources
- RDS Instance: `job-analyzer-postgres`
- Instance Type: `db.t4g.micro`
- Engine: PostgreSQL 15.8
- Storage: 20GB gp3
- Database: `jobanalyzer`
- Schema: Prisma-managed with pgvector extension

### Data to Migrate
- User data (if any)
- Resume data
- Analysis data
- Job posting data
- Schema structure
- pgvector extension configuration

## Migration Strategy

### Option A: Blue-Green Migration (Recommended)
**Pros**: Zero downtime, easy rollback, test before switching
**Cons**: Temporarily runs both databases (double cost for migration period)

**Steps**:
1. Create Aurora Serverless v1 cluster (new CloudFormation stack)
2. Export data from RDS PostgreSQL
3. Import data to Aurora Serverless v1
4. Test application with Aurora connection
5. Update application to use Aurora endpoint
6. Verify everything works
7. Delete RDS instance

### Option B: Direct Migration
**Pros**: Simpler, no double cost
**Cons**: Downtime during migration, harder to rollback

**Steps**:
1. Take final backup of RDS
2. Delete RDS instance
3. Create Aurora Serverless v1 cluster
4. Restore data
5. Update application

## Detailed Migration Steps (Option A - Recommended)

### Phase 1: Preparation (30 minutes)

1. **Backup Current Database**
   ```bash
   # Create manual snapshot
   aws rds create-db-snapshot \
     --db-instance-identifier job-analyzer-postgres \
     --db-snapshot-identifier job-analyzer-pre-migration-$(date +%Y%m%d)
   
   # Export data using pg_dump
   pg_dump -h <rds-endpoint> -U dbadmin -d jobanalyzer \
     --no-owner --no-acl -F c -f backup-$(date +%Y%m%d).dump
   ```

2. **Document Current Configuration**
   - Connection string
   - Environment variables
   - Prisma schema
   - Any custom PostgreSQL settings

3. **Review Current Data Size**
   ```sql
   SELECT pg_size_pretty(pg_database_size('jobanalyzer'));
   ```

### Phase 2: Create Aurora Serverless v1 (15 minutes)

1. **Create CloudFormation Template**
   - File: `infra/cloudformation/aurora-serverless-v1.yml`
   - Configure auto-pause (5 minutes idle)
   - Set min/max capacity units (0.5 - 2 ACU recommended)
   - Enable Data API (optional, for easier Lambda access)
   - Configure VPC and security groups

2. **Deploy Aurora Cluster**
   ```bash
   aws cloudformation create-stack \
     --stack-name job-analyzer-aurora-serverless \
     --template-body file://infra/cloudformation/aurora-serverless-v1.yml \
     --parameters \
       ParameterKey=DBUsername,ParameterValue=dbadmin \
       ParameterKey=DBPassword,ParameterValue=<secure-password> \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Wait for Cluster Creation**
   ```bash
   aws cloudformation wait stack-create-complete \
     --stack-name job-analyzer-aurora-serverless
   ```

### Phase 3: Data Migration (30-60 minutes)

1. **Install pgvector Extension**
   ```sql
   -- Connect to Aurora cluster
   psql -h <aurora-endpoint> -U dbadmin -d jobanalyzer
   
   -- Create extension
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- Verify
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

2. **Restore Database**
   ```bash
   # Using pg_restore
   pg_restore -h <aurora-endpoint> -U dbadmin -d jobanalyzer \
     --no-owner --no-acl backup-$(date +%Y%m%d).dump
   
   # Or using Prisma
   npx prisma db push --skip-generate
   ```

3. **Verify Data Integrity**
   ```sql
   -- Check table counts
   SELECT schemaname, tablename, 
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables 
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   
   -- Verify pgvector works
   SELECT vector_dims('[1,2,3]'::vector);
   ```

### Phase 4: Application Testing (30 minutes)

1. **Update Environment Variables (Test)**
   ```bash
   # Create .env.aurora for testing
   DATABASE_URL="postgresql://dbadmin:<password>@<aurora-endpoint>:5432/jobanalyzer"
   ```

2. **Test Application Locally**
   ```bash
   # Use Aurora connection
   cp .env.aurora .env
   npm run dev
   
   # Run integration tests
   npm run test:integration
   ```

3. **Test Cold Start Behavior**
   - Let Aurora pause (wait 5+ minutes)
   - Make a request
   - Verify 30-second resume time is acceptable
   - Test that application handles connection timeout gracefully

4. **Verify All Features**
   - Resume upload
   - Analysis generation
   - S3 integration
   - Firebase authentication
   - Database queries

### Phase 5: Cutover (15 minutes)

1. **Update Production Environment Variables**
   ```bash
   # Update .env
   DATABASE_URL="postgresql://dbadmin:<password>@<aurora-endpoint>:5432/jobanalyzer"
   ```

2. **Update CloudFormation Exports**
   - Ensure any stack references are updated
   - Update service roles if needed

3. **Deploy Application**
   - Commit environment variable changes
   - Deploy to production (when ready)

### Phase 6: Cleanup (10 minutes)

1. **Monitor Aurora for 24-48 Hours**
   - Check CloudWatch metrics
   - Verify auto-pause is working
   - Monitor costs in AWS Cost Explorer

2. **Delete RDS Instance**
   ```bash
   # Create final snapshot
   aws rds create-db-snapshot \
     --db-instance-identifier job-analyzer-postgres \
     --db-snapshot-identifier job-analyzer-final-snapshot
   
   # Delete instance (keeps final snapshot)
   aws rds delete-db-instance \
     --db-instance-identifier job-analyzer-postgres \
     --final-db-snapshot-identifier job-analyzer-final-$(date +%Y%m%d) \
     --skip-final-snapshot  # Only if you already have a snapshot
   ```

3. **Delete RDS CloudFormation Stack**
   ```bash
   aws cloudformation delete-stack \
     --stack-name job-analyzer-rds
   ```

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**
   ```bash
   # Revert environment variables to RDS endpoint
   DATABASE_URL="postgresql://dbadmin:<password>@<rds-endpoint>:5432/jobanalyzer"
   ```

2. **If RDS Already Deleted**
   ```bash
   # Restore from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier job-analyzer-postgres-restored \
     --db-snapshot-identifier job-analyzer-final-snapshot
   ```

## Cost Analysis

### Current RDS PostgreSQL
- Instance: $12.41/month (db.t4g.micro, 730 hours)
- Storage: $2.30/month (20GB gp3)
- Backups: $0 (within free tier)
- **Total**: ~$14.71/month (always running)

### Aurora Serverless v1 (Projected)
- **Scenario 1: Active Development (8 hours/day)**
  - Compute: 240 hours × $0.06 = $14.40/month
  - Storage: 20GB × $0.10 = $2.00/month
  - **Total**: ~$16.40/month

- **Scenario 2: Weekend Project (16 hours/week)**
  - Compute: 64 hours × $0.06 = $3.84/month
  - Storage: 20GB × $0.10 = $2.00/month
  - **Total**: ~$5.84/month

- **Scenario 3: Occasional Demos (4 hours/month)**
  - Compute: 4 hours × $0.06 = $0.24/month
  - Storage: 20GB × $0.10 = $2.00/month
  - **Total**: ~$2.24/month

### Savings
- **Active development**: Similar cost (~$16 vs $15)
- **Weekend project**: **Save ~$9/month** (60% reduction)
- **Occasional use**: **Save ~$12/month** (85% reduction)

## Aurora Serverless v1 Configuration

### Recommended Settings
```yaml
# CloudFormation parameters
MinCapacity: 2  # Minimum ACU (Aurora Capacity Units)
MaxCapacity: 4  # Maximum ACU
AutoPause: true
SecondsUntilAutoPause: 300  # 5 minutes (minimum)
```

### Capacity Units Explained
- **1 ACU** = 2GB RAM + corresponding CPU
- **Min 2 ACU** = 4GB RAM (good for development)
- **Max 4 ACU** = 8GB RAM (handles traffic spikes)
- Scales automatically between min/max based on load

### Auto-Pause Behavior
- Pauses after 5 minutes of no connections
- Resume time: ~30 seconds on first connection
- Application should handle connection timeout gracefully
- Consider adding retry logic for cold starts

## Application Changes Required

### 1. Connection Timeout Handling
```typescript
// server/database/connection.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Handle Aurora cold starts
  connectionTimeout: 60000, // 60 seconds
  pool: {
    timeout: 60000,
  },
});

export default prisma;
```

### 2. Retry Logic for Cold Starts
```typescript
// server/utils/db-retry.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Check if it's a connection timeout (Aurora waking up)
      if (error.code === 'P1001' || error.code === 'P2024') {
        console.log(`Database waking up, retry ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const data = await withRetry(() => prisma.resume.findMany());
```

### 3. User-Facing Loading State
```vue
<!-- components/LoadingState.vue -->
<template>
  <div v-if="isWakingUp" class="loading-state">
    <p>Waking up the database (first request may take ~30 seconds)...</p>
    <progress-bar />
  </div>
</template>
```

## Testing Checklist

- [ ] Aurora cluster created successfully
- [ ] pgvector extension installed and working
- [ ] All data migrated (verify counts)
- [ ] Prisma migrations applied
- [ ] Application connects successfully
- [ ] All CRUD operations work
- [ ] S3 integration still works
- [ ] Firebase auth still works
- [ ] Cold start behavior acceptable (30 seconds)
- [ ] Auto-pause working (check after 5+ min idle)
- [ ] Auto-resume working (first query after pause)
- [ ] CloudWatch metrics showing up
- [ ] Costs tracking correctly in AWS Cost Explorer

## Monitoring and Alerts

### CloudWatch Metrics to Monitor
- `ServerlessDatabaseCapacity` - Current ACU usage
- `ACUUtilization` - Percentage of capacity used
- `DatabaseConnections` - Active connections
- `CPUUtilization` - CPU usage
- `FreeableMemory` - Available memory

### Recommended Alarms
```yaml
# High capacity usage (approaching max)
ACUUtilizationAlarm:
  Threshold: 80%
  Action: Email notification

# Frequent scaling events (might need higher max)
ScalingEventsAlarm:
  Threshold: 10 per hour
  Action: Email notification
```

## Documentation Updates Needed

- [ ] Update README with new database setup
- [ ] Update .env.example with Aurora endpoint format
- [ ] Document cold start behavior for demos
- [ ] Update deployment docs
- [ ] Add troubleshooting guide for connection timeouts

## Timeline

- **Preparation**: 30 minutes
- **Aurora creation**: 15 minutes
- **Data migration**: 30-60 minutes
- **Testing**: 30 minutes
- **Cutover**: 15 minutes
- **Monitoring**: 24-48 hours
- **Cleanup**: 10 minutes

**Total active time**: ~2-3 hours
**Total elapsed time**: 2-3 days (including monitoring period)

## Success Criteria

- ✅ All data migrated successfully
- ✅ Application works with Aurora
- ✅ Auto-pause working after 5 minutes idle
- ✅ Auto-resume working (30-second cold start acceptable)
- ✅ Costs reduced for intermittent usage
- ✅ No data loss
- ✅ All features working (S3, Firebase, pgvector)

## Next Steps

1. Review this plan
2. Schedule migration window (low-traffic time)
3. Create Aurora CloudFormation template
4. Test migration in development environment first
5. Execute production migration
6. Monitor for 48 hours
7. Clean up old RDS resources
