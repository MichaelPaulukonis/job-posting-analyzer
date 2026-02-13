# Service Roles CloudFormation Template

## Overview

This CloudFormation template creates IAM roles that enable AWS services to communicate securely with each other following the principle of least privilege. These roles are essential for the Job Posting Analyzer application's AWS infrastructure.

## Roles Created

### 1. App Runner Instance Role

**Purpose**: Allows App Runner service instances to access AWS resources (S3, RDS, ECR, Secrets Manager)

**Role Name**: `job-analyzer-app-runner-instance-role`

**Trust Relationship**: `tasks.apprunner.amazonaws.com`

**Permissions**:
- **S3 Access**: Read/write/delete objects in application buckets
- **RDS Access**: Connect to RDS databases using IAM authentication
- **ECR Access**: Pull container images from ECR repositories
- **Secrets Manager**: Retrieve database credentials and API keys
- **CloudWatch Logs**: Write application logs

**Use Case**: Attach this role to your App Runner service configuration

### 2. App Runner Access Role

**Purpose**: Allows App Runner to pull container images from ECR during deployment

**Role Name**: `job-analyzer-app-runner-access-role`

**Trust Relationship**: `build.apprunner.amazonaws.com`

**Permissions**:
- Uses AWS managed policy: `AWSAppRunnerServicePolicyForECRAccess`
- Allows ECR image pulling during App Runner builds

**Use Case**: Specify this role when creating App Runner service from ECR image

### 3. RDS Enhanced Monitoring Role

**Purpose**: Enables RDS Enhanced Monitoring to publish metrics to CloudWatch

**Role Name**: `job-analyzer-rds-monitoring-role`

**Trust Relationship**: `monitoring.rds.amazonaws.com`

**Permissions**:
- Uses AWS managed policy: `AmazonRDSEnhancedMonitoringRole`
- Publishes RDS metrics to CloudWatch

**Use Case**: Specify this role when enabling Enhanced Monitoring on RDS instances

### 4. CloudFormation Service Role

**Purpose**: Allows CloudFormation to create and manage AWS resources on your behalf

**Role Name**: `job-analyzer-cloudformation-service-role`

**Trust Relationship**: `cloudformation.amazonaws.com`

**Permissions**:
- Create/manage IAM roles and policies
- Create/manage RDS instances
- Create/manage S3 buckets
- Create/manage ECR repositories
- Create/manage App Runner services
- Create/manage VPC security groups
- Create/manage Secrets Manager secrets

**Use Case**: Use this role when deploying other CloudFormation stacks with `--role-arn` parameter

### 5. Lambda Execution Role (Future Use)

**Purpose**: Execution role for Lambda functions that may be added later

**Role Name**: `job-analyzer-lambda-execution-role`

**Trust Relationship**: `lambda.amazonaws.com`

**Permissions**:
- Basic Lambda execution (CloudWatch Logs)
- VPC access for Lambda functions
- RDS database connections
- S3 object operations
- Secrets Manager access

**Use Case**: Attach to Lambda functions for background processing or API endpoints

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create IAM roles and policies
- CloudFormation permissions

### Quick Deployment

```bash
# Using the deployment script (recommended)
./scripts/deploy-service-roles.sh

# Or manually with AWS CLI
aws cloudformation create-stack \
  --stack-name job-analyzer-service-roles \
  --template-body file://infra/cloudformation/service-roles.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=job-analyzer \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Validation

```bash
# Validate template syntax
aws cloudformation validate-template \
  --template-body file://infra/cloudformation/service-roles.yml

# Check stack status
aws cloudformation describe-stacks \
  --stack-name job-analyzer-service-roles

# View stack outputs (role ARNs)
aws cloudformation describe-stacks \
  --stack-name job-analyzer-service-roles \
  --query 'Stacks[0].Outputs'
```

## Security Best Practices

### Principle of Least Privilege

All roles are configured with the minimum permissions required:

1. **Resource Scoping**: Permissions are scoped to specific resources using ARN patterns
   - S3: `arn:aws:s3:::job-analyzer-*`
   - ECR: `arn:aws:ecr:*:*:repository/job-analyzer-*`
   - Secrets: `arn:aws:secretsmanager:*:*:secret:job-analyzer/*`

2. **Action Restrictions**: Only necessary actions are granted
   - No wildcard `*` actions except where required by AWS services
   - Specific actions like `s3:GetObject`, `rds-db:connect` instead of broad permissions

3. **Trust Relationships**: Roles can only be assumed by specific AWS services
   - App Runner roles: Only `tasks.apprunner.amazonaws.com`
   - RDS monitoring: Only `monitoring.rds.amazonaws.com`
   - Lambda: Only `lambda.amazonaws.com`

### Recommendations

1. **Regular Audits**: Review role permissions quarterly
2. **CloudTrail Logging**: Enable CloudTrail to monitor role usage
3. **Access Analyzer**: Use IAM Access Analyzer to identify unused permissions
4. **Rotation**: Rotate credentials and review trust relationships regularly
5. **Tagging**: All roles are tagged for easy identification and cost tracking

## Using the Roles

### App Runner Service Configuration

```yaml
# app-runner-config.yml
ServiceName: job-analyzer-app
SourceConfiguration:
  ImageRepository:
    ImageIdentifier: <ECR_IMAGE_URI>
    ImageRepositoryType: ECR
    ImageConfiguration:
      Port: 3000
  AuthenticationConfiguration:
    AccessRoleArn: <AppRunnerAccessRoleArn>  # From stack outputs
InstanceConfiguration:
  InstanceRoleArn: <AppRunnerInstanceRoleArn>  # From stack outputs
  Cpu: 1024
  Memory: 2048
```

### RDS Instance Configuration

```bash
aws rds create-db-instance \
  --db-instance-identifier job-analyzer-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 20 \
  --monitoring-interval 60 \
  --monitoring-role-arn <RDSEnhancedMonitoringRoleArn>  # From stack outputs
```

### CloudFormation Stack Deployment with Service Role

```bash
aws cloudformation create-stack \
  --stack-name job-analyzer-rds \
  --template-body file://rds-setup.yml \
  --role-arn <CloudFormationServiceRoleArn>  # From stack outputs
```

## Troubleshooting

### Common Issues

#### 1. "User is not authorized to perform: iam:CreateRole"

**Solution**: Ensure your AWS credentials have IAM permissions. You need:
- `iam:CreateRole`
- `iam:PutRolePolicy`
- `iam:AttachRolePolicy`

#### 2. "CAPABILITY_NAMED_IAM not acknowledged"

**Solution**: Add `--capabilities CAPABILITY_NAMED_IAM` to your CloudFormation command

#### 3. "Role already exists"

**Solution**: Either:
- Delete the existing role first
- Update the stack instead of creating: `update-stack` instead of `create-stack`
- Change the `EnvironmentName` parameter to create roles with different names

#### 4. "Access Denied when assuming role"

**Solution**: Check:
- Trust relationship is correctly configured
- Service trying to assume the role is in the trust policy
- No SCPs (Service Control Policies) blocking the action

### Verification Commands

```bash
# List all roles created by the stack
aws iam list-roles \
  --query 'Roles[?contains(RoleName, `job-analyzer`)].RoleName'

# Get role details
aws iam get-role --role-name job-analyzer-app-runner-instance-role

# List policies attached to a role
aws iam list-attached-role-policies \
  --role-name job-analyzer-app-runner-instance-role

# Get inline policy details
aws iam get-role-policy \
  --role-name job-analyzer-app-runner-instance-role \
  --policy-name job-analyzer-app-runner-s3-access
```

## Stack Outputs

After successful deployment, the stack exports the following outputs:

| Output Key | Description | Usage |
|------------|-------------|-------|
| `AppRunnerInstanceRoleArn` | ARN of App Runner instance role | Use in App Runner service configuration |
| `AppRunnerAccessRoleArn` | ARN of App Runner ECR access role | Use when creating App Runner from ECR |
| `RDSEnhancedMonitoringRoleArn` | ARN of RDS monitoring role | Use when enabling RDS Enhanced Monitoring |
| `CloudFormationServiceRoleArn` | ARN of CloudFormation service role | Use with `--role-arn` in CF deployments |
| `LambdaExecutionRoleArn` | ARN of Lambda execution role | Attach to Lambda functions |

## Cleanup

To delete all roles created by this stack:

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack \
  --stack-name job-analyzer-service-roles

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name job-analyzer-service-roles
```

**Warning**: Ensure no services are using these roles before deletion. Deleting roles in use will cause service failures.

## Related Documentation

- [IAM Setup Template](./iam-setup.yml) - User and deployment permissions
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [App Runner IAM Roles](https://docs.aws.amazon.com/apprunner/latest/dg/security-iam-service-with-iam.html)
- [RDS Enhanced Monitoring](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Monitoring.OS.html)

## Version History

- **v1.0.0** (2026-02-11): Initial creation with 5 service roles
  - App Runner Instance Role
  - App Runner Access Role
  - RDS Enhanced Monitoring Role
  - CloudFormation Service Role
  - Lambda Execution Role
