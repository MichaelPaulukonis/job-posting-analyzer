---
description: Cost-conscious cloud architecture for personal projects with zero income
globs: infra/**, docs/plans/**, *.yml, *.yaml
alwaysApply: true
---

# Cost-Conscious Cloud Architecture

## Core Principle
**This is a personal project with few users and zero income. Prioritize cost-effective AWS solutions that enable learning AWS skills (including Bedrock exploration) while minimizing expenses.**

### Balancing Cost and Learning
- **Primary goal**: Learn AWS services and architecture patterns
- **Secondary goal**: Minimize costs for a zero-income project
- **Approach**: Use AWS-native services at lowest cost tier, not third-party alternatives
- **Example**: Aurora Serverless v1 (AWS, $2-16/month) over Neon (third-party, $0/month) for AWS learning

## Cost Hierarchy (Preference Order)

### 1. AWS Free Tier / Low-Cost AWS Services (Highest Priority)
- ✅ AWS Free Tier services (Lambda, API Gateway, CloudFront, S3)
- ✅ AWS pay-per-use services (Aurora Serverless v1 with auto-pause)
- ✅ AWS services that scale to zero
- ✅ Local development for rapid iteration (Docker, local Postgres)

### 2. AWS Services with Justifiable Cost (Medium Priority)
- ✅ Services that teach valuable AWS skills (Bedrock, SageMaker, etc.)
- ✅ Services needed for AWS architecture patterns
- ✅ Services that enable AWS ecosystem integration
- **Requirement**: Must provide learning value or AWS-specific capabilities

### 3. Third-Party Services (Lower Priority)
- ⚠️ Free third-party services (Neon, Supabase, Vercel)
- **Use only if**: AWS alternative is significantly more expensive (>$20/month difference)
- **Trade-off**: Less AWS learning, but cost savings

### 4. Always-On AWS Services (Low Priority - Avoid)
- ❌ RDS instances without auto-pause (always running)
- ❌ EC2 instances (always running)
- ❌ App Runner (minimum $7/month, less learning value than Lambda)
- ❌ ECS/EKS (complex + expensive)

### 5. Premium AWS Services (Avoid Unless Justified)
- ❌ Provisioned capacity
- ❌ Multi-AZ deployments (unless required)
- ❌ Reserved instances (no predictable usage)
- ❌ Enterprise features

## Decision Framework

### Before Recommending Any Cloud Service, Ask:

1. **Is there an AWS-native solution?**
   - Prefer AWS services for learning AWS skills
   - Example: Aurora Serverless v1 (AWS) over Neon (third-party)
   - Exception: If AWS option is >$20/month more expensive

2. **Can this be done locally for development?**
   - Development databases → Docker Postgres
   - Testing → Local environment
   - Prototyping → Local tools
   - Deploy to AWS when ready to learn deployment

3. **Is there a free tier option?**
   - Lambda: 1M requests/month free
   - API Gateway: 1M requests/month free
   - CloudFront: 1TB data transfer free
   - S3: 5GB storage free
   - Bedrock: Pay-per-use (no free tier, but low cost for experimentation)

4. **Does it auto-pause when idle?**
   - Aurora Serverless v1: Yes ✅
   - RDS: No ❌
   - Lambda: Yes (pay per use) ✅

5. **What's the monthly cost if NOT free tier?**
   - < $5/month: Good for AWS learning
   - $5-20/month: Acceptable if provides AWS skills/experience
   - > $20/month: Requires strong justification (learning value + necessity)

6. **Does it enable AWS ecosystem learning?**
   - Bedrock integration: Yes ✅ (even if costs a few dollars)
   - Lambda patterns: Yes ✅
   - CloudFormation IaC: Yes ✅
   - Third-party service: No ❌ (unless significant cost savings)

## Cost-Conscious Patterns

### ✅ DO: Use These Patterns

**Local Development First**
```yaml
# docker-compose.yml for local dev
services:
  postgres:
    image: ankane/pgvector:latest
    # Free, fast, full control
```

**Free Tier Services**
```yaml
# Lambda + API Gateway + CloudFront
# All have generous free tiers
# Pay-per-use after free tier
```

**Auto-Pause Databases**
```yaml
# Aurora Serverless v1
AutoPause: true
SecondsUntilAutoPause: 300  # 5 minutes
# $0 when paused, $0.06/hour when active
```

**Deploy-on-Demand**
```bash
# Only deploy when showcasing
./deploy.sh  # Deploy for demo
# ... demo the app ...
./teardown.sh  # Delete resources
```

### ❌ DON'T: Avoid These Patterns

**Always-On Databases**
```yaml
# RDS PostgreSQL
# $12-15/month even when idle ❌
```

**Provisioned Capacity**
```yaml
# Lambda Provisioned Concurrency
# Keeps instances warm but costs extra ❌
```

**Multi-AZ for Personal Projects**
```yaml
# Multi-AZ RDS
# 2x cost for high availability we don't need ❌
```

**Reserved Instances**
```yaml
# 1-year or 3-year commitments
# No predictable usage pattern ❌
```

## Cost Monitoring

### Always Set Up Alarms
```yaml
# CloudWatch Budget Alarm
Budget: $10/month  # Adjust based on project
Alert: 80% threshold
Action: Email notification
```

### Monthly Cost Review
- Check AWS Cost Explorer
- Compare actual vs expected
- Identify unexpected charges
- Adjust or delete unused resources

### Cost Optimization Checklist
- [ ] Using free tier where possible?
- [ ] Services auto-pause when idle?
- [ ] Unnecessary resources deleted?
- [ ] CloudWatch alarms configured?
- [ ] Monthly cost < $20?

## Service Selection Guide

### Database Options (Ranked by Cost + AWS Learning Value)

1. **Local Docker Postgres** - $0/month ✅
   - Best for: Development, rapid iteration
   - AWS learning: None
   - Limitations: Not accessible for demos

2. **Aurora Serverless v1** - $2-16/month ✅ **RECOMMENDED FOR AWS LEARNING**
   - Best for: AWS learning + production with auto-pause
   - AWS learning: High (Aurora, RDS, VPC, CloudFormation)
   - Limitations: 30-second cold start
   - **Preferred over Neon for AWS skill development**

3. **Neon Free Tier** - $0/month
   - Best for: Cost savings if AWS learning not priority
   - AWS learning: None (third-party)
   - Limitations: 0.5GB storage, no pgvector on free tier
   - **Use only if Aurora cost is prohibitive**

4. **RDS PostgreSQL** - $12-15/month ❌
   - Best for: Always-on production
   - AWS learning: Medium (RDS, but no serverless patterns)
   - Avoid: Too expensive, no auto-pause

### Compute Options (Ranked by Cost + AWS Learning Value)

1. **Local Development** - $0/month ✅
   - Best for: Development, rapid iteration
   - AWS learning: None
   - Limitations: Not accessible for demos

2. **Lambda + API Gateway** - $0-5/month ✅ **RECOMMENDED FOR AWS LEARNING**
   - Best for: Serverless patterns, AWS learning, demos
   - AWS learning: High (Lambda, API Gateway, CloudFormation, serverless architecture)
   - Free tier covers most usage
   - **Preferred over third-party platforms**

3. **App Runner** - $7-10/month minimum
   - Best for: Simple container deployment
   - AWS learning: Medium (less than Lambda)
   - Avoid: More expensive than Lambda, less learning value

4. **EC2** - $8+/month ❌
   - Best for: Traditional server patterns
   - AWS learning: Medium (EC2, but not modern serverless)
   - Avoid: Always running, maintenance overhead

### Storage Options (Ranked by Cost)

1. **Local Storage** - $0/month ✅
   - Best for: Development

2. **S3** - $0-2/month ✅
   - Best for: Production file storage
   - Free tier: 5GB storage

3. **EBS** - $8+/month ❌
   - Avoid: Requires EC2, expensive

## Cost Estimation Template

When proposing any cloud architecture, provide:

```markdown
## Cost Breakdown

### Free Tier Usage
- Service A: $0 (within free tier)
- Service B: $0 (within free tier)

### Paid Services
- Service C: $X/month (auto-pause)
- Service D: $Y/month (pay-per-use)

### Total Estimated Cost
- **Minimum** (idle): $Z/month
- **Typical** (light usage): $Z/month
- **Maximum** (heavy usage): $Z/month

### Cost Comparison
- Current approach: $X/month
- Proposed approach: $Y/month
- **Savings**: $Z/month (N% reduction)

### Alternative: Free/Cheaper Option
- Option: [Name]
- Cost: $0-X/month
- Trade-offs: [List limitations]
```

## Red Flags (Stop and Reconsider)

### 🚨 If You See These, Pause and Evaluate:
- Monthly cost > $20
- Always-on services for personal project
- Provisioned capacity
- Multi-AZ deployments
- Reserved instances
- Enterprise features
- Services without free tier
- No auto-pause capability

### Questions to Ask:
1. Is there a free alternative?
2. Can we use local development instead?
3. Can we deploy only when needed?
4. Is this feature critical for a demo?
5. What's the cost if we exceed free tier?

## Examples

### ✅ Good: AWS-Native + Cost-Conscious Recommendation
```
I recommend using Aurora Serverless v1 with auto-pause:
- Cost: $2/month when paused (most of the time)
- Cost: $16/month if active 8 hours/day
- AWS learning: High (Aurora, RDS, VPC, serverless patterns)
- Trade-off: 30-second cold start (acceptable for demos)

This is more expensive than Neon free tier ($0/month), but provides
valuable AWS experience and keeps you in the AWS ecosystem for
potential Bedrock integration later.
```

### ✅ Good: Bedrock Exploration Justification
```
I recommend adding Bedrock for AI features:
- Cost: ~$0.50-2/month for experimentation (pay-per-use)
- AWS learning: High (Bedrock, AI/ML services, AWS SDK)
- Value: Enables exploring AWS AI services
- Trade-off: Small cost, but high learning value

Even though this adds cost, it aligns with your goal to explore
AWS services and could enhance the project's capabilities.
```

### ❌ Bad: Expensive Recommendation Without Justification
```
I recommend using RDS Multi-AZ with provisioned IOPS:
- Cost: $50-100/month
- High availability and performance
```
**Problem**: Way too expensive for personal project, and doesn't provide
significantly more AWS learning than Aurora Serverless v1!

### ✅ Good: Free Tier Focus with AWS Learning
```
I recommend using Lambda + API Gateway + CloudFront:
- Lambda: $0/month (free tier: 1M requests)
- API Gateway: $0/month (free tier: 1M requests)
- CloudFront: $0/month (free tier: 1TB transfer)
- Total: $0/month for typical demo usage
- AWS learning: High (serverless architecture, CloudFormation, IaC)

This is AWS-native, teaches valuable serverless patterns, and is
essentially free for your usage level.
```

### ⚠️ Acceptable: Third-Party When AWS is Too Expensive
```
For development, consider Neon free tier ($0/month) instead of
Aurora Serverless v1 ($2-16/month) if you want to minimize costs
during the development phase.

Trade-off: Less AWS learning, but significant cost savings.
You can migrate to Aurora later when ready to deploy and learn
AWS database services.
```

## Cost-Saving Strategies

### Strategy 1: Local Development + Deploy for Demos
```bash
# Develop locally (free)
docker-compose up

# Deploy only when showcasing
./deploy.sh
# ... demo ...
./teardown.sh

# Annual cost: ~$10-30 (deploy 4-6 times/year)
```

### Strategy 2: Free Tier Maximization
```yaml
# Use services with generous free tiers
- Lambda: 1M requests/month free
- API Gateway: 1M requests/month free
- CloudFront: 1TB data transfer free
- S3: 5GB storage free
- Neon: 0.5GB database free

# Total: $0/month for low traffic
```

### Strategy 3: Auto-Pause Everything
```yaml
# Aurora Serverless v1: Auto-pause after 5 min
# Lambda: Pay per invocation only
# CloudFront: Pay per request only

# Cost when idle: ~$2/month (just storage)
```

## Integration with Other Rules

This rule works with:
- [infrastructure-as-code.md](.kiro/steering/infrastructure-as-code.md) - IaC for cost tracking
- [dev_workflow.md](.kiro/steering/dev_workflow.md) - Development workflow

## AWS Learning Priorities

### High-Value AWS Services for Learning
These services provide significant learning value and are worth the cost:

1. **Lambda + API Gateway** ($0-5/month)
   - Serverless architecture patterns
   - Event-driven design
   - CloudFormation IaC

2. **Aurora Serverless v1** ($2-16/month)
   - Serverless database patterns
   - Auto-scaling and auto-pause
   - VPC networking

3. **CloudFront + S3** ($0-2/month)
   - CDN and edge computing
   - Static asset optimization
   - Origin configurations

4. **Bedrock** (~$0.50-5/month for experimentation)
   - AWS AI/ML services
   - Foundation model integration
   - Prompt engineering
   - **Worth exploring even if not directly needed for project**

5. **CloudFormation** ($0)
   - Infrastructure as Code
   - Stack management
   - AWS resource orchestration

### Medium-Value AWS Services
Consider if project needs them:

1. **SageMaker** (pay-per-use)
   - Custom ML models
   - Model training and deployment
   - Use only if Bedrock insufficient

2. **Step Functions** ($0-2/month)
   - Workflow orchestration
   - State machines
   - Complex business logic

3. **EventBridge** ($0-1/month)
   - Event-driven architecture
   - Service integration
   - Scheduled tasks

### Low-Value for Learning (Avoid)
These don't teach modern AWS patterns:

1. **EC2** - Traditional servers (not serverless)
2. **RDS (non-serverless)** - Always-on databases
3. **Elastic Beanstalk** - Abstraction layer (less control)

## Bedrock Exploration Guidelines

### When to Add Bedrock
- **Cost**: ~$0.50-5/month for experimentation
- **Learning value**: High (AWS AI services, prompt engineering)
- **Integration**: Easy with Lambda, API Gateway
- **Justification**: Aligns with AWS learning goals

### Bedrock Use Cases for This Project
Even if not immediately needed, consider exploring:

1. **Resume Analysis Enhancement**
   - Use Bedrock to analyze resume content
   - Extract skills and experience
   - Generate improvement suggestions

2. **Job Posting Analysis**
   - Analyze job descriptions
   - Match requirements to resume
   - Generate cover letter suggestions

3. **AI-Powered Features**
   - Chatbot for career advice
   - Interview question generation
   - Salary negotiation tips

### Bedrock Cost Management
```yaml
# Keep costs low while learning
- Use Claude Instant (cheaper than Claude 3)
- Limit token usage in development
- Cache responses when possible
- Set CloudWatch alarms for usage
- Budget: $5/month for experimentation
```

## When to Override This Rule

**Only override for:**
1. Critical production requirements (not applicable for personal project)
2. Security requirements that justify cost
3. User explicitly requests expensive option and acknowledges cost

**Always:**
- Explain the cost implications
- Provide cheaper alternatives
- Get user confirmation before proceeding

## Summary

**Default mindset**: AWS-native services first (for learning), free tier when possible, pay-per-use over always-on, third-party only if AWS is prohibitively expensive.

**Before recommending any service**:
1. Prefer AWS-native solutions (learning value)
2. Check if free tier exists
3. Calculate monthly cost
4. Justify cost with AWS learning value
5. Provide third-party alternatives only if AWS >$20/month more expensive
6. Get user approval if > $20/month

**Remember**: This is a personal project with zero income, but AWS learning is a priority. Balance cost-effectiveness with AWS skill development.
