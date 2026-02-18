# Deployment Strategy Summary

## Executive Summary

After analyzing costs and architecture options, we've identified a cost-effective serverless deployment strategy for the job posting analyzer application.

## Key Decisions

### 1. Database: RDS PostgreSQL with Manual Stop/Start
**Why**: ~~Aurora Serverless v1 no longer available in us-east-1~~ Manual stop/start reduces costs from $15/month to $2.30/month when stopped.

**Cost Savings**:
- RDS Running: $12-15/month
- RDS Stopped: $2.30/month (storage only)
- **Savings**: ~$10-13/month when stopped (87% reduction)

**Trade-offs**:
- ✅ pgvector support maintained
- ✅ Simple management scripts created
- ⚠️ Manual start/stop required (2-3 minute startup)
- ⚠️ Auto-restarts after 7 days when stopped

**Why Not Aurora Serverless v1?**:
- Aurora Serverless v1 no longer available in us-east-1 (AWS phasing out)
- Aurora Serverless v2 doesn't support auto-pause (minimum $43.80/month - too expensive)

### 2. Compute: Lambda + API Gateway + CloudFront (Not App Runner)
**Why**: Pay-per-use model is ideal for intermittent usage patterns.

**Cost Comparison**:
- Lambda + CloudFront: $2-24/month (mostly free tier for low traffic)
- App Runner: $50-100/month (always running)
- **Savings**: $26-76/month (52-95% reduction)

**Architecture**:
```
CloudFront (CDN) → API Gateway → Lambda (Nuxt SSR)
                                    ↓
                    RDS PostgreSQL + S3 + Firebase
```

## Total Cost Projection

### Current Setup (RDS PostgreSQL)
- RDS: $15/month
- S3: $1/month
- Firebase: $0/month
- **Total**: $16/month (no compute deployed yet)

### Proposed Setup (RDS Manual Stop/Start + Lambda)

**Scenario 1: Occasional Demos (4 hours/month)**
- RDS: $2.30/month (stopped most of the time)
- Lambda: $0/month (free tier)
- API Gateway: $0/month (free tier)
- CloudFront: $0/month (free tier)
- S3: $1/month
- **Total**: ~$3.30/month
- **Savings**: $12.70/month (79% reduction)

**Scenario 2: Weekend Project (16 hours/week, stopped between sessions)**
- RDS: $6/month (running ~50% of time)
- Lambda: $1/month
- API Gateway: $0/month (free tier)
- CloudFront: $1/month
- S3: $1/month
- **Total**: ~$9/month
- **Savings**: $7/month (44% reduction)

**Scenario 3: Active Development (8 hours/day, always running)**
- RDS: $15/month (always running)
- Lambda: $2/month
- API Gateway: $1/month
- CloudFront: $2/month
- S3: $1/month
- **Total**: ~$21/month
- **Savings**: None (but enables deployment)

## Alternative Options Considered

### Option A: Neon Free Tier (Development Only)
- **Cost**: $0/month
- **Limits**: 0.5GB storage, 100 hours compute/month
- **pgvector**: Requires paid plan ($19/month)
- **Verdict**: Good for development, not production

### Option B: Local Development + Deploy for Demos
- **Cost**: $0/month (development), $2-5/month (demo days only)
- **Annual**: ~$10-30/year
- **Verdict**: Most cost-effective, but requires manual deployment

### Option C: Supabase (All-in-One)
- **Cost**: $0-25/month
- **Includes**: Database + Auth + Storage
- **Verdict**: Could replace Firebase + S3 + Database, but requires migration

## Recommended Approach

### Phase 1: Database Cost Optimization (Priority: High) ✅ COMPLETE
**Action**: ~~Migrate from RDS PostgreSQL to Aurora Serverless v1~~ Created RDS management scripts for manual stop/start

**Benefits**:
- Immediate cost savings ($10-13/month when stopped)
- Simple bash scripts for easy management
- pgvector support maintained
- No migration needed (keeping existing RDS)

**Status**: Complete
- Created `scripts/db/stop-rds.sh`
- Created `scripts/db/start-rds.sh`
- Created `scripts/db/status-rds.sh`
- Documented usage workflow

**See**: `docs/implementation/task-10.1-aurora-migration.md`

### Phase 2: Lambda Deployment (Priority: Medium)
**Action**: Deploy application using Lambda + API Gateway + CloudFront

**Benefits**:
- Pay-per-use (essentially free for demos)
- Global CDN for better performance
- Scales automatically

**Timeline**: 4-6 hours setup, 1-2 hours per deployment

**See**: `docs/plans/lambda-deployment-architecture.md`

### Phase 3: Cost Optimization (Priority: Low)
**Action**: Monitor and optimize based on actual usage

**Options**:
- Use local development + deploy for demos only
- Evaluate Neon or Supabase for further savings
- Implement CloudWatch alarms for cost monitoring

**See**: `docs/plans/database-alternatives.md`

## Implementation Plan

### Immediate Actions (This Week)
1. ✅ Review all planning documents
2. ✅ Understand cost implications
3. ✅ Decide on database strategy (RDS manual stop/start)
4. ⏳ Decide on deployment timing (now vs later)

### Short-term (Next 2-4 Weeks)
1. ✅ Created RDS management scripts
2. ⏳ Test stop/start workflow
3. ⏳ Monitor costs for 1-2 weeks
4. ⏳ Decide on Lambda deployment timing

### Medium-term (Next 1-3 Months)
1. Create Lambda deployment infrastructure
2. Test deployment locally
3. Deploy to AWS when ready to showcase
4. Monitor costs and optimize

### Long-term (3-6 Months)
1. Evaluate actual usage patterns
2. Consider alternatives (Neon, Supabase) if needed
3. Optimize based on real data
4. Scale up if project gains traction

## Risk Assessment

### Low Risk
- ✅ Aurora migration (same PostgreSQL, easy rollback)
- ✅ Lambda deployment (can delete if not working)
- ✅ Cost monitoring (AWS Cost Explorer)

### Medium Risk
- ⚠️ Cold start delays (30 seconds for Aurora, 1-3 seconds for Lambda)
- ⚠️ Free tier limits (need to monitor usage)
- ⚠️ Complexity (more components than App Runner)

### Mitigation Strategies
- Test cold start behavior before showcasing
- Set up CloudWatch alarms for cost overruns
- Document deployment process thoroughly
- Keep RDS snapshot for rollback

## Success Criteria

### Database Migration Success ✅ COMPLETE
- ✅ RDS management scripts created
- ✅ pgvector extension working (already enabled)
- ✅ Stop/start workflow documented
- ✅ Application works with RDS
- ✅ Cost savings strategy implemented

### Lambda Deployment Success
- ✅ Application accessible via CloudFront URL
- ✅ SSR rendering working correctly
- ✅ API endpoints functional
- ✅ Static assets served from S3
- ✅ Database connectivity working
- ✅ Costs within expected range

## Cost Monitoring

### CloudWatch Alarms
```yaml
# Set up alarms for:
- Lambda invocations > 100K/month
- API Gateway requests > 1M/month
- CloudFront data transfer > 100GB/month
- RDS running hours > 200/month (if always-on)
```

### Monthly Review
- Check AWS Cost Explorer
- Compare actual vs projected costs
- Adjust strategy if needed
- Document lessons learned

## Questions & Answers

### Q: Can Aurora Serverless v1 do vector storage?
**A**: ~~Yes! Aurora Serverless v1 is PostgreSQL-compatible and supports pgvector extension.~~ **UPDATED**: Aurora Serverless v1 no longer available. Using RDS PostgreSQL with pgvector instead.

### Q: What's the cold start time?
**A**: 
- RDS: ~2-3 minutes (when starting from stopped state)
- Lambda: 1-3 seconds (first request)
- Combined: ~2-3 minutes worst case (when RDS stopped)

### Q: Can I pause RDS manually?
**A**: Yes! Use `./scripts/db/stop-rds.sh` to stop RDS manually. It will auto-restart after 7 days. Use `./scripts/db/start-rds.sh` to start it again.

### Q: What if I exceed free tier?
**A**: Set up CloudWatch alarms to notify you. Costs are still low even after free tier (~$1-2/month for moderate usage).

### Q: Can I rollback if something goes wrong?
**A**: Yes! 
- RDS: Already using RDS, no rollback needed
- Lambda: Revert to previous version
- CloudFront: Invalidate cache and redeploy

### Q: Should I do this now or wait?
**A**: 
- **Database optimization**: ✅ Complete (scripts created)
- **Lambda deployment**: Wait until ready to showcase (no rush)

## Next Steps

1. ✅ **Review this summary** and all planning documents
2. ✅ **Database strategy decided**: RDS with manual stop/start
3. ⏳ **Test RDS stop/start workflow**:
   - Run `./scripts/db/stop-rds.sh` to test stopping
   - Wait 2-3 minutes
   - Run `./scripts/db/start-rds.sh` to test starting
   - Verify application still works
4. ⏳ **Decide on deployment timing**:
   - Option A: Deploy Lambda now (start incurring costs)
   - Option B: Wait until ready to showcase (no costs)
   - Option C: Deploy only for specific demos (minimal costs)
5. ⏳ **Proceed to Task 10.2** (Nuxt Lambda configuration) when ready

## Related Documents

- [Aurora Serverless Migration Plan](./aurora-serverless-migration.md)
- [Database Alternatives Analysis](./database-alternatives.md)
- [Lambda Deployment Architecture](./lambda-deployment-architecture.md)

## Cost Summary Table

| Scenario | Current | Proposed | Savings | Notes |
|----------|---------|----------|---------|-------|
| **No deployment** | $16/month | $2.30/month | $13.70/month (86%) | RDS stopped, no compute |
| **Occasional demos** | N/A | $3.30/month | N/A | 4 hours/month usage |
| **Weekend project** | N/A | $9/month | N/A | 16 hours/week usage |
| **Active development** | N/A | $21/month | N/A | 8 hours/day usage |
| **Always-on (App Runner)** | N/A | $50-100/month | N/A | Not recommended |

**Recommendation**: Use RDS stop/start scripts for immediate savings, deploy Lambda when ready to showcase.
