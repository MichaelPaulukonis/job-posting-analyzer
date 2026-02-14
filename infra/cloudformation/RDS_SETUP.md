# RDS PostgreSQL Setup with pgvector

This CloudFormation template creates an RDS PostgreSQL instance configured for the job-posting-analyzer application with pgvector extension support for semantic search.

## Overview

The template provisions:
- VPC with 2 subnets across availability zones
- Internet Gateway and routing configuration
- DB subnet group for RDS placement
- Security group allowing PostgreSQL access (port 5432)
- DB parameter group with pgvector extension preloaded
- RDS PostgreSQL 15.8 instance (db.t4g.micro)
- Automated backups with 7-day retention
- CloudWatch logs export for monitoring

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VPC (10.0.0.0/16)                │
│                                                     │
│  ┌──────────────────┐    ┌──────────────────┐     │
│  │  Subnet 1 (AZ-a) │    │  Subnet 2 (AZ-b) │     │
│  │  10.0.1.0/24     │    │  10.0.2.0/24     │     │
│  └────────┬─────────┘    └────────┬─────────┘     │
│           │                       │                │
│           └───────────┬───────────┘                │
│                       │                            │
│              ┌────────▼────────┐                   │
│              │  RDS PostgreSQL │                   │
│              │  db.t4g.micro   │                   │
│              │  20GB gp3       │                   │
│              └─────────────────┘                   │
│                                                     │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
                Internet Gateway
```

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| EnvironmentName | job-analyzer | Environment name for tagging |
| DBInstanceClass | db.t4g.micro | Database instance type |
| DBAllocatedStorage | 20 | Storage in GB (20-100) |
| DBName | jobanalyzer | Initial database name |
| DBUsername | dbadmin | Master username |
| DBPassword | (required) | Master password (min 8 chars) |

## Resources Created

### Networking
- **DBVPC**: VPC with CIDR 10.0.0.0/16
- **InternetGateway**: For public internet access
- **DBSubnet1/2**: Subnets in different AZs
- **RouteTable**: Routes traffic to internet gateway
- **DBSubnetGroup**: Groups subnets for RDS

### Security
- **DBSecurityGroup**: Allows inbound PostgreSQL (5432) from anywhere
  - ⚠️ **Production**: Restrict to specific CIDR blocks or security groups

### Database
- **DBParameterGroup**: PostgreSQL 15 parameter group
  - `shared_preload_libraries`: pg_stat_statements
  - `max_connections`: 100
  - Note: pgvector extension is installed via CREATE EXTENSION (not preloaded)
- **DBInstance**: RDS PostgreSQL instance
  - Engine: PostgreSQL 15.8
  - Instance: db.t4g.micro (2 vCPU, 1GB RAM)
  - Storage: 20GB gp3 (encrypted)
  - Backups: 7-day retention
  - Multi-AZ: Disabled (for cost savings)
  - Public access: Enabled (for development)

## Deployment

### Prerequisites
- AWS CLI configured with appropriate credentials
- IAM permissions for CloudFormation, RDS, EC2, VPC

### Validate Template
```bash
./scripts/validate-rds.sh
```

### Deploy Stack
```bash
./scripts/deploy-rds.sh
```

The script will:
1. Validate the CloudFormation template
2. Prompt for database password
3. Create the stack
4. Wait for completion (5-10 minutes)
5. Display stack outputs

### Manual Deployment
```bash
aws cloudformation create-stack \
  --stack-name job-analyzer-rds \
  --template-body file://infra/cloudformation/rds-setup.yml \
  --parameters \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
  --region us-east-1
```

## Outputs

| Output | Description | Export Name |
|--------|-------------|-------------|
| DBInstanceEndpoint | Database hostname | job-analyzer-db-endpoint |
| DBInstancePort | Database port (5432) | job-analyzer-db-port |
| DBName | Database name | job-analyzer-db-name |
| DBSecurityGroupId | Security group ID | job-analyzer-db-security-group-id |
| ConnectionString | Connection string template | - |

## Post-Deployment Steps

### 1. Test Connection
```bash
# Get endpoint from stack outputs
ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name job-analyzer-rds \
  --query 'Stacks[0].Outputs[?OutputKey==`DBInstanceEndpoint`].OutputValue' \
  --output text)

# Connect with psql
psql -h $ENDPOINT -U dbadmin -d jobanalyzer
```

### 2. Enable pgvector Extension
```sql
-- Connect to database first
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 3. Store Credentials Securely
```bash
# Option 1: AWS Secrets Manager
aws secretsmanager create-secret \
  --name job-analyzer/db/password \
  --secret-string "YourSecurePassword123"

# Option 2: Local .env file (not committed)
echo "DATABASE_URL=postgresql://dbadmin:YourPassword@$ENDPOINT:5432/jobanalyzer" >> .env
```

### 4. Configure Application
Update your application's environment variables:
```env
DB_HOST=<endpoint-from-outputs>
DB_PORT=5432
DB_NAME=jobanalyzer
DB_USER=dbadmin
DB_PASSWORD=<your-password>
```

## Security Considerations

### Development Environment
- ✅ Public access enabled for easy development
- ✅ Security group allows 0.0.0.0/0 (all IPs)
- ✅ Deletion protection disabled
- ✅ Single-AZ deployment

### Production Recommendations
- 🔒 Restrict security group to specific CIDR blocks
- 🔒 Use VPC peering or PrivateLink for App Runner
- 🔒 Enable deletion protection
- 🔒 Enable Multi-AZ for high availability
- 🔒 Use AWS Secrets Manager for credentials
- 🔒 Enable enhanced monitoring
- 🔒 Configure automated minor version upgrades
- 🔒 Set up CloudWatch alarms for metrics

## Cost Optimization

### Current Configuration (~$15-20/month)
- db.t4g.micro: $12-15/month
- 20GB gp3 storage: $2.30/month
- Backup storage: First 20GB free
- Data transfer: Minimal for development

### Cost Reduction Options
- Use RDS Free Tier (db.t3.micro, 20GB, 1 year)
- Reduce backup retention period
- Stop instance when not in use (storage charges still apply)

### Scaling Up
- Increase instance class: db.t4g.small ($25-30/month)
- Add read replicas for read-heavy workloads
- Enable Multi-AZ for production ($2x cost)

## Monitoring

### CloudWatch Metrics
- CPUUtilization
- DatabaseConnections
- FreeStorageSpace
- ReadLatency / WriteLatency

### CloudWatch Logs
- PostgreSQL logs exported automatically
- View in CloudWatch Logs console

### Performance Insights
Enable for detailed database performance monitoring:
```bash
aws rds modify-db-instance \
  --db-instance-identifier job-analyzer-postgres \
  --enable-performance-insights \
  --performance-insights-retention-period 7
```

## Troubleshooting

### Cannot Connect to Database
1. Check security group rules allow your IP
2. Verify database is in 'available' state
3. Confirm endpoint and port are correct
4. Test network connectivity: `telnet <endpoint> 5432`

### pgvector Extension Not Available
1. Verify parameter group is attached to instance
2. Check `shared_preload_libraries` includes 'pgvector'
3. Reboot instance if parameter group was just attached
4. Run `CREATE EXTENSION vector;` in database

### Stack Creation Failed
1. Check CloudFormation events for error details
2. Verify IAM permissions are sufficient
3. Ensure parameter values meet constraints
4. Check AWS service quotas (RDS instances, VPCs)

### High Costs
1. Review RDS instance metrics for utilization
2. Consider stopping instance during off-hours
3. Reduce backup retention if not needed
4. Monitor data transfer costs

## Maintenance

### Backup and Restore
```bash
# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier job-analyzer-postgres \
  --db-snapshot-identifier job-analyzer-manual-snapshot-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier job-analyzer-postgres-restored \
  --db-snapshot-identifier <snapshot-id>
```

### Update Stack
```bash
aws cloudformation update-stack \
  --stack-name job-analyzer-rds \
  --template-body file://infra/cloudformation/rds-setup.yml \
  --parameters ParameterKey=DBInstanceClass,ParameterValue=db.t4g.small
```

### Delete Stack
```bash
# Creates final snapshot before deletion
aws cloudformation delete-stack --stack-name job-analyzer-rds
```

## References

- [RDS PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [pgvector Extension](https://github.com/pgvector/pgvector)
- [CloudFormation RDS Resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-rds-dbinstance.html)
- [Infrastructure-as-Code Guidelines](../../.kiro/steering/infrastructure-as-code.md)

## Task Reference

This implementation corresponds to:
- Task 2: RDS PostgreSQL Database Setup with pgvector
- Subtask 2.1: Create RDS PostgreSQL Instance with db.t4g.micro
