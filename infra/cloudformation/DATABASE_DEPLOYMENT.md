# Database Deployment Guide

## Quick Start

Deploy everything with one command:

```bash
./scripts/deploy-database.sh
```

This single script handles:
1. ✅ CloudFormation infrastructure deployment
2. ✅ Security group configuration
3. ✅ PostgreSQL extensions (uuid-ossp, pgvector)
4. ✅ Database schema creation

**Time**: 8-12 minutes

## What Gets Created

### AWS Infrastructure (CloudFormation)
- VPC with 2 subnets across availability zones
- Internet Gateway and routing
- DB subnet group
- Security group (PostgreSQL port 5432)
- RDS PostgreSQL 15.8 instance (db.t4g.micro)
- 20GB gp3 encrypted storage
- Automated backups (7-day retention)

### Database Setup (SQL)
- Extensions: uuid-ossp, pgvector
- 8 tables: users, resumes, resume_embeddings, job_postings, job_posting_embeddings, analysis_results, cover_letters, conversations
- Indexes for performance and vector similarity search
- Triggers for automatic timestamp updates
- Views for common queries

## Prerequisites

- AWS CLI configured with credentials
- PostgreSQL client (`psql`) installed
- Network access to AWS

## Deployment Steps

### 1. Run Deployment Script

```bash
./scripts/deploy-database.sh
```

You'll be prompted for:
- Database master password (min 8 alphanumeric characters)

The script will:
- Validate CloudFormation template
- Deploy RDS infrastructure (5-10 minutes)
- Add your IP to security group
- Enable PostgreSQL extensions
- Create database schema

### 2. Save Connection Details

Add to your `.env` file:
```env
DB_HOST=<endpoint-from-output>
DB_PORT=5432
DB_NAME=jobanalyzer
DB_USER=dbadmin
DB_PASSWORD=<your-password>
```

### 3. Test Connection

```bash
psql -h <endpoint> -U dbadmin -d jobanalyzer
```

## Troubleshooting

### Connection Timeout During Deployment

If the script can't connect immediately after stack creation:

```bash
# Wait 2-3 minutes, then run:
./scripts/initialize-database.sh
```

This will retry the database initialization steps.

### Stack Already Exists

The script handles existing stacks automatically. It will update the stack if changes are detected.

### Password Requirements

- Minimum 8 characters
- Alphanumeric only (a-z, A-Z, 0-9)
- No special characters

### Security Group Issues

If you can't connect:
1. Check your IP hasn't changed: `curl https://checkip.amazonaws.com`
2. Manually add your IP:
   ```bash
   aws ec2 authorize-security-group-ingress \
     --group-id <sg-id> \
     --protocol tcp --port 5432 \
     --cidr <your-ip>/32
   ```

## Manual Deployment (Alternative)

If you prefer step-by-step:

### 1. Deploy Infrastructure
```bash
aws cloudformation create-stack \
  --stack-name job-analyzer-rds \
  --template-body file://infra/cloudformation/rds-setup.yml \
  --parameters ParameterKey=DBPassword,ParameterValue=<password>
```

### 2. Wait for Completion
```bash
aws cloudformation wait stack-create-complete \
  --stack-name job-analyzer-rds
```

### 3. Initialize Database
```bash
./scripts/initialize-database.sh
```

## Stack Management

### View Stack Status
```bash
aws cloudformation describe-stacks \
  --stack-name job-analyzer-rds \
  --query 'Stacks[0].[StackStatus,CreationTime]'
```

### View Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name job-analyzer-rds \
  --query 'Stacks[0].Outputs'
```

### Update Stack
```bash
# Modify template, then:
aws cloudformation update-stack \
  --stack-name job-analyzer-rds \
  --template-body file://infra/cloudformation/rds-setup.yml
```

### Delete Stack
```bash
aws cloudformation delete-stack --stack-name job-analyzer-rds
```

**Note**: This creates a final snapshot before deletion.

## Cost Estimate

- db.t4g.micro: ~$12-15/month
- 20GB gp3 storage: ~$2.30/month
- Backup storage: First 20GB free
- **Total**: ~$15-20/month

## Next Steps

After deployment:
1. ✅ Update application `.env` file
2. ✅ Test database connection
3. ➡️ Migrate existing JSON data
4. ➡️ Update application code to use database
5. ➡️ Deploy application to App Runner

## Files Reference

- `infra/cloudformation/rds-setup.yml` - Infrastructure template
- `server/database/schema.sql` - Database schema
- `scripts/deploy-database.sh` - Consolidated deployment
- `scripts/initialize-database.sh` - Database initialization only
- `docs/implementation/task-2.*` - Detailed documentation

## Support

For issues:
1. Check CloudFormation events for infrastructure errors
2. Check PostgreSQL logs in CloudWatch
3. Verify security group rules
4. Test network connectivity with `telnet <endpoint> 5432`
