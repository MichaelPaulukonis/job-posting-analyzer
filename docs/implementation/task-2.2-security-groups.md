# Task 2.2: Configure Security Groups - Implementation Guide

**Status**: 🔄 Ready to Execute (after RDS deployment)  
**Dependencies**: Task 2.1 (RDS instance must be deployed)

## Overview

Configure the RDS security group to allow secure access from:
1. Development environment (your local machine)
2. AWS App Runner service (when created)

## Current Configuration

The CloudFormation template creates a security group with:
- **Default Rule**: Allow PostgreSQL (port 5432) from 0.0.0.0/0 (anywhere)
- ⚠️ This is intentionally permissive for initial setup

## Security Hardening Steps

### Step 1: Run Configuration Script

After RDS deployment, run:
```bash
./scripts/configure-db-security.sh
```

This script will:
1. Retrieve the security group ID from CloudFormation
2. Detect your current public IP
3. Optionally add your IP to the security group
4. Display current rules
5. Provide commands for additional configuration

### Step 2: Add Development IP (Manual)

If you prefer manual configuration:

```bash
# Get security group ID
SG_ID=$(aws cloudformation describe-stacks \
  --stack-name job-analyzer-rds \
  --query 'Stacks[0].Outputs[?OutputKey==`DBSecurityGroupId`].OutputValue' \
  --output text)

# Get your public IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

# Add your IP
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr $MY_IP/32 \
  --group-rule-description "Development access"
```

### Step 3: Add App Runner Access (After App Runner Creation)

Once App Runner service is created:

```bash
# Get App Runner security group ID (from App Runner service)
APP_RUNNER_SG_ID="<from-app-runner-stack>"

# Allow App Runner to access database
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $APP_RUNNER_SG_ID \
  --group-rule-description "App Runner service access"
```

### Step 4: Remove Permissive Rule (Production)

For production, remove the 0.0.0.0/0 rule:

```bash
aws ec2 revoke-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0
```

## Security Best Practices

### Development Environment
- ✅ Allow specific IP addresses only
- ✅ Use /32 CIDR for single IPs
- ✅ Add descriptive rule descriptions
- ✅ Regularly audit and remove unused rules

### Production Environment
- 🔒 Remove 0.0.0.0/0 rule
- 🔒 Only allow App Runner security group
- 🔒 Use VPC peering or PrivateLink for enhanced security
- 🔒 Enable VPC Flow Logs for monitoring
- 🔒 Set up CloudWatch alarms for unusual access patterns

## Verification

### Test Database Connectivity

```bash
# Get database endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name job-analyzer-rds \
  --query 'Stacks[0].Outputs[?OutputKey==`DBInstanceEndpoint`].OutputValue' \
  --output text)

# Test connection
psql -h $DB_ENDPOINT -U dbadmin -d jobanalyzer -c "SELECT version();"
```

### View Current Rules

```bash
aws ec2 describe-security-groups \
  --group-ids $SG_ID \
  --query 'SecurityGroups[0].IpPermissions[*].[FromPort,ToPort,IpRanges[*].CidrIp,IpRanges[*].Description]' \
  --output table
```

## Common Scenarios

### Scenario 1: Multiple Developers

Add each developer's IP:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 5432 \
  --cidr 203.0.113.10/32 \
  --group-rule-description "Developer Alice"

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 5432 \
  --cidr 203.0.113.20/32 \
  --group-rule-description "Developer Bob"
```

### Scenario 2: Office Network

Allow entire office IP range:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 5432 \
  --cidr 203.0.113.0/24 \
  --group-rule-description "Office network"
```

### Scenario 3: CI/CD Pipeline

Add CI/CD service IP:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 5432 \
  --cidr <CI_CD_IP>/32 \
  --group-rule-description "GitHub Actions runner"
```

## Troubleshooting

### Cannot Connect to Database

1. **Check security group rules**:
   ```bash
   aws ec2 describe-security-groups --group-ids $SG_ID
   ```

2. **Verify your current IP**:
   ```bash
   curl https://checkip.amazonaws.com
   ```

3. **Test network connectivity**:
   ```bash
   telnet $DB_ENDPOINT 5432
   ```

4. **Check RDS instance status**:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier job-analyzer-postgres \
     --query 'DBInstances[0].DBInstanceStatus'
   ```

### Rule Already Exists Error

If you get "already exists" error:
```bash
# List existing rules first
aws ec2 describe-security-groups --group-ids $SG_ID

# Remove duplicate rule
aws ec2 revoke-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 5432 \
  --cidr <DUPLICATE_IP>/32
```

## Monitoring

### CloudWatch Metrics

Monitor database connections:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=job-analyzer-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### VPC Flow Logs (Optional)

Enable for detailed network monitoring:
```bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids <VPC_ID> \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/flowlogs
```

## Next Steps

After security group configuration:
1. ✅ Test database connectivity from development machine
2. ➡️ Proceed to Task 2.3: Enable pgvector extension
3. ➡️ Configure App Runner security group when service is created

## References

- [AWS Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [RDS Security Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.Security.html)
- [Task 2: RDS PostgreSQL Setup](../../.taskmaster/tasks/task-2.md)
