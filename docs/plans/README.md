# Deployment Planning Documents

## Overview
This directory contains comprehensive planning documents for deploying the job posting analyzer application to AWS using a cost-effective serverless architecture.

## Quick Start

**Read these in order:**

1. **[Deployment Strategy Summary](./deployment-strategy-summary.md)** ⭐ START HERE
   - Executive summary of all decisions
   - Cost comparisons
   - Recommended approach
   - Next steps

2. **[Aurora Serverless Migration Plan](./aurora-serverless-migration.md)**
   - Detailed migration steps from RDS to Aurora Serverless v1
   - Cost analysis and savings
   - Rollback procedures
   - Testing checklist

3. **[Lambda Deployment Architecture](./lambda-deployment-architecture.md)**
   - Complete serverless architecture design
   - CloudFormation templates
   - Deployment scripts
   - Monitoring and security

4. **[Database Alternatives Analysis](./database-alternatives.md)**
   - Comparison of 8 database options
   - Cost breakdown for each
   - Pros/cons analysis
   - Recommendations by use case

## Key Decisions

### Database: Aurora Serverless v1
- **Why**: Auto-pause after 5 minutes idle
- **Cost**: $2/month (paused) to $16/month (active 8 hrs/day)
- **Savings**: $0-13/month vs current RDS
- **Trade-off**: 30-second cold start (acceptable for demos)

### Compute: Lambda + API Gateway + CloudFront
- **Why**: Pay-per-use, essentially free for demos
- **Cost**: $2-24/month depending on usage
- **Savings**: $26-76/month vs App Runner
- **Architecture**: CloudFront → API Gateway → Lambda → Aurora

## Cost Summary

| Scenario | Monthly Cost | Annual Cost | Best For |
|----------|-------------|-------------|----------|
| **Occasional demos** (4 hrs/month) | $3 | $36 | Showcasing when ready |
| **Weekend project** (16 hrs/week) | $9 | $108 | Regular development |
| **Active development** (8 hrs/day) | $22 | $264 | Full-time work |
| **Always-on** (App Runner) | $50-100 | $600-1200 | Production apps |

## Implementation Status

### ✅ Completed
- [x] Architecture analysis
- [x] Cost comparison
- [x] Planning documents
- [x] Task breakdown (Task 10 with 8 subtasks)

### ⏳ Pending (Planning Only - No Implementation Yet)
- [ ] Aurora Serverless v1 migration
- [ ] Lambda deployment configuration
- [ ] CloudFormation templates
- [ ] Deployment scripts
- [ ] Production deployment

## Task 10 Breakdown

Task 10 has been broken down into 8 subtasks:

1. **Migrate to Aurora Serverless v1** - Database migration with auto-pause
2. **Configure Nuxt for Lambda** - Build configuration for serverless
3. **Create S3 CloudFormation** - Static assets bucket
4. **Create Lambda CloudFormation** - Function and IAM roles
5. **Create API Gateway CloudFormation** - HTTP API routing
6. **Create CloudFront CloudFormation** - CDN distribution
7. **Create Deployment Scripts** - Automation for CI/CD
8. **Deploy and Verify** - Production deployment and testing

## When to Implement

### Immediate (This Week)
- Review all planning documents
- Understand cost implications
- Make final decisions on approach

### Short-term (Next 2-4 Weeks)
- Migrate to Aurora Serverless v1 (immediate cost savings)
- Test auto-pause behavior
- Monitor costs

### Medium-term (Next 1-3 Months)
- Create Lambda deployment infrastructure
- Test locally
- Deploy when ready to showcase

### Long-term (3-6 Months)
- Monitor actual usage patterns
- Optimize based on real data
- Consider alternatives if needed

## Alternative Approaches

### Option A: Aurora + Lambda (Recommended)
- **Cost**: $2-24/month
- **Best for**: Intermittent usage, demos
- **Pros**: Auto-pause, pay-per-use
- **Cons**: Cold starts (30 seconds)

### Option B: Local Dev + Deploy for Demos
- **Cost**: $0-5/month (deploy only when demoing)
- **Best for**: Budget-conscious, infrequent demos
- **Pros**: Minimal cost
- **Cons**: Manual deployment

### Option C: Neon Free Tier
- **Cost**: $0/month (0.5GB, 100 hours)
- **Best for**: Development only
- **Pros**: Free, instant resume
- **Cons**: Limited storage, no pgvector on free tier

### Option D: Supabase
- **Cost**: $0-25/month
- **Best for**: Replacing Firebase + S3 + Database
- **Pros**: All-in-one solution
- **Cons**: Migration effort

## Questions & Answers

### Q: Should I do this now?
**A**: 
- **Database migration**: Yes, soon (immediate cost savings)
- **Lambda deployment**: When ready to showcase (no rush)

### Q: What if costs are higher than expected?
**A**: 
- Set up CloudWatch alarms
- Can pause Aurora manually by stopping connections
- Can delete Lambda deployment if not needed
- All changes are reversible

### Q: Can I rollback if something goes wrong?
**A**: Yes!
- Aurora: Restore from snapshot
- Lambda: Revert to previous version
- CloudFront: Invalidate cache and redeploy

### Q: What about the 30-second cold start?
**A**: 
- Only happens after 5+ minutes of no activity
- Acceptable for demos (can warn users)
- Can keep warm with CloudWatch Events if needed

### Q: Is pgvector supported?
**A**: Yes! Aurora Serverless v1 is PostgreSQL-compatible and supports pgvector extension.

## Cost Monitoring

### Set Up Alarms For:
- Lambda invocations > 100K/month
- API Gateway requests > 1M/month
- CloudFront data transfer > 100GB/month
- Aurora active hours > 200/month

### Monthly Review:
- Check AWS Cost Explorer
- Compare actual vs projected costs
- Adjust strategy if needed
- Document lessons learned

## Related Files

### Planning Documents (This Directory)
- `deployment-strategy-summary.md` - Executive summary
- `aurora-serverless-migration.md` - Database migration plan
- `lambda-deployment-architecture.md` - Serverless architecture
- `database-alternatives.md` - Alternative options

### Implementation Documents (When Ready)
- `../implementation/task-10-*.md` - Implementation notes (created during execution)
- `../../infra/cloudformation/aurora-serverless-v1.yml` - Aurora template (to be created)
- `../../infra/cloudformation/lambda-function.yml` - Lambda template (to be created)
- `../../infra/cloudformation/api-gateway.yml` - API Gateway template (to be created)
- `../../infra/cloudformation/cloudfront-distribution.yml` - CloudFront template (to be created)

### Deployment Scripts (When Ready)
- `../../scripts/deploy/build-lambda.sh` - Build and package
- `../../scripts/deploy/deploy-static-assets.sh` - S3 upload
- `../../scripts/deploy/deploy-lambda.sh` - Lambda deployment
- `../../scripts/deploy/invalidate-cloudfront.sh` - Cache invalidation
- `../../scripts/deploy/deploy-all.sh` - Full deployment

## Success Criteria

### Database Migration
- ✅ All data migrated successfully
- ✅ pgvector extension working
- ✅ Auto-pause working after 5 minutes
- ✅ Application works with Aurora
- ✅ Costs reduced for idle periods

### Lambda Deployment
- ✅ Application accessible via CloudFront URL
- ✅ SSR rendering working correctly
- ✅ API endpoints functional
- ✅ Static assets served from S3
- ✅ Database connectivity working
- ✅ Costs within expected range

## Next Steps

1. **Review** all planning documents
2. **Decide** on database strategy (Aurora vs alternatives)
3. **Decide** on deployment timing (now vs later)
4. **Execute** database migration (when ready)
5. **Create** Lambda infrastructure (when ready to showcase)
6. **Deploy** application (when ready to demo)
7. **Monitor** costs and optimize

## Support

For questions or issues:
1. Review planning documents thoroughly
2. Check AWS documentation for specific services
3. Test in development environment first
4. Monitor costs closely during first month
5. Adjust strategy based on actual usage

## Version History

- **2026-02-16**: Initial planning documents created
  - Architecture analysis complete
  - Cost comparisons documented
  - Task 10 broken down into 8 subtasks
  - All planning documents finalized

---

**Remember**: This is planning only. No implementation has been done yet. Execute when ready to showcase the application.
