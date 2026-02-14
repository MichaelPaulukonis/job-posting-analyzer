# AWS Infrastructure Inventory

**Project**: Job Posting Analyzer  
**Environment**: Production (job-analyzer)  
**Region**: us-east-1  
**Last Updated**: February 14, 2026  
**Managed By**: CloudFormation (Infrastructure as Code)

## Table of Contents

1. [AWS Account Information](#aws-account-information)
2. [IAM Users](#iam-users)
3. [IAM Roles](#iam-roles)
4. [IAM Policies](#iam-policies)
5. [CloudFormation Stacks](#cloudformation-stacks)
6. [Security Configuration](#security-configuration)
7. [Credential Storage](#credential-storage)
8. [Service Relationships](#service-relationships)
9. [Resource Naming Conventions](#resource-naming-conventions)
10. [Access Control Matrix](#access-control-matrix)

---

## AWS Account Information

### Account Details

- **Account Type**: Individual/Development
- **Root User**: Secured with MFA
- **Primary Region**: us-east-1 (US East - N. Virginia)
- **Account ID**: [Stored securely in password manager]
- **Billing Alerts**: Configured
- **Cost Allocation Tags**: Environment, Project, Purpose

### Administrative Access

- **Root User**: Emergency access only, MFA enabled
- **Admin User**: `job-analyzer-admin` (console access, MFA enabled)
- **Deployment User**: `job-analyzer-dev` (programmatic access)

---

## IAM Users

### 1. Deployment User

**Username**: `job-analyzer-dev`  
**Type**: Programmatic access only (no console)  
**Purpose**: Application deployment and infrastructure management  
**Created**: Task 1.2 (Initial IAM Setup)  
**CloudFormation Stack**: `job-analyzer-iam`

**Access Keys**:
- Access Key ID: [Stored in password manager and `.env` file]
- Secret Access Key: [Stored in password manager and `.env` file]
- **⚠️ NEVER commit to version control**

**Attached Policies**:
1. `job-analyzer-rds-access` (Custom)
2. `job-analyzer-s3-access` (Custom)
3. `job-analyzer-app-runner-access` (Custom)
4. `job-analyzer-ecr-access` (Custom)
5. `job-analyzer-vpc-access` (Custom)
6. `job-analyzer-cloudformation-access` (Custom)

**Tags**:
- Environment: job-analyzer
- Project: job-posting-analyzer
- Purpose: Application deployment and infrastructure management

---

## IAM Roles

All roles are managed via CloudFormation in `infra/cloudformation/service-roles.yml`.

### 1. App Runner Instance Role

**Role Name**: `job-analyzer-app-runner-instance-role`  
**ARN**: [Retrieved from CloudFormation stack outputs]  
**Purpose**: Runtime permissions for App Runner service instances  
**Trust Relationship**: `tasks.apprunner.amazonaws.com`

**Attached Policies**:
- `job-analyzer-app-runner-s3-access` (Custom)
- `job-analyzer-app-runner-rds-access` (Custom)
- `job-analyzer-app-runner-ecr-access` (Custom)
- `job-analyzer-app-runner-secrets-access` (Custom)
- `CloudWatchLogsFullAccess` (AWS Managed)

**Permissions Summary**:
- S3: Read/write/delete objects in `job-analyzer-*` buckets
- RDS: IAM database authentication
- ECR: Pull container images
- Secrets Manager: Retrieve application secrets
- CloudWatch: Write application logs

**Usage**: Attached to App Runner service configuration (Task 10)

### 2. App Runner Access Role

**Role Name**: `job-analyzer-app-runner-access-role`  
**ARN**: [Retrieved from CloudFormation stack outputs]  
**Purpose**: ECR image pulling during App Runner deployment  
**Trust Relationship**: `build.apprunner.amazonaws.com`

**Attached Policies**:
- `AWSAppRunnerServicePolicyForECRAccess` (AWS Managed)

**Usage**: Specified when creating App Runner service from ECR image

### 3. RDS Enhanced Monitoring Role

**Role Name**: `job-analyzer-rds-monitoring-role`  
**ARN**: [Retrieved from CloudFormation stack outputs]  
**Purpose**: Publish RDS metrics to CloudWatch  
**Trust Relationship**: `monitoring.rds.amazonaws.com`

**Attached Policies**:
- `AmazonRDSEnhancedMonitoringRole` (AWS Managed)

**Usage**: Specified when enabling Enhanced Monitoring on RDS instances (Task 2)

### 4. CloudFormation Service Role

**Role Name**: `job-analyzer-cloudformation-service-role`  
**ARN**: [Retrieved from CloudFormation stack outputs]  
**Purpose**: Manage infrastructure resources on behalf of CloudFormation  
**Trust Relationship**: `cloudformation.amazonaws.com`

**Attached Policies**:
- `job-analyzer-cloudformation-service-policy` (Custom)

**Permissions Summary**:
- IAM: Create/manage roles and policies
- RDS: Full management
- S3: Bucket and object management
- ECR: Repository management
- App Runner: Service management
- VPC: Security group management
- Secrets Manager: Secret management

**Usage**: Use with `--role-arn` parameter in CloudFormation deployments

### 5. Lambda Execution Role

**Role Name**: `job-analyzer-lambda-execution-role`  
**ARN**: [Retrieved from CloudFormation stack outputs]  
**Purpose**: Execution role for future Lambda functions  
**Trust Relationship**: `lambda.amazonaws.com`

**Attached Policies**:
- `AWSLambdaBasicExecutionRole` (AWS Managed)
- `AWSLambdaVPCAccessExecutionRole` (AWS Managed)
- `job-analyzer-lambda-resource-access` (Custom)

**Permissions Summary**:
- CloudWatch Logs: Write function logs
- VPC: Access resources in VPC
- RDS: Database connections
- S3: Object operations
- Secrets Manager: Retrieve secrets

**Usage**: Attach to Lambda functions when created

---

## IAM Policies

### Custom Policies for Deployment User

All policies are defined in `infra/cloudformation/iam-setup.yml`.

#### 1. RDS Access Policy

**Policy Name**: `job-analyzer-rds-access`  
**Type**: Inline policy attached to deployment user

**Permissions**:
```yaml
Actions:
  - rds:CreateDBInstance
  - rds:ModifyDBInstance
  - rds:DeleteDBInstance
  - rds:DescribeDBInstances
  - rds:DescribeDBClusters
  - rds:CreateDBSecurityGroup
  - rds:ModifyDBSecurityGroups
  - rds:DescribeDBSecurityGroups
  - rds:CreateDBParameterGroup
  - rds:ModifyDBParameterGroup
  - rds:DescribeDBParameterGroups
  - rds-db:connect

Resource: "*"
Condition: Region = us-east-1
```

#### 2. S3 Access Policy

**Policy Name**: `job-analyzer-s3-access`  
**Type**: Inline policy attached to deployment user

**Permissions**:
```yaml
Bucket Operations:
  Actions:
    - s3:CreateBucket
    - s3:ListBucket
    - s3:GetBucketLocation
    - s3:PutBucketVersioning
    - s3:GetBucketVersioning
    - s3:PutBucketAcl
    - s3:GetBucketAcl
    - s3:PutBucketTagging
    - s3:GetBucketTagging
  Resource: arn:aws:s3:::job-analyzer-*

Object Operations:
  Actions:
    - s3:GetObject
    - s3:PutObject
    - s3:DeleteObject
    - s3:ListBucketVersions
    - s3:GetObjectVersion
  Resource: arn:aws:s3:::job-analyzer-*/*
```

#### 3. App Runner Access Policy

**Policy Name**: `job-analyzer-app-runner-access`  
**Type**: Inline policy attached to deployment user

**Permissions**:
```yaml
Actions:
  - apprunner:CreateService
  - apprunner:UpdateService
  - apprunner:DeleteService
  - apprunner:DescribeService
  - apprunner:ListServices
  - apprunner:StartService
  - apprunner:StopService
  - apprunner:CreateConnection
  - apprunner:DescribeConnection
  - apprunner:ListConnections

Resource: "*"
```

#### 4. ECR Access Policy

**Policy Name**: `job-analyzer-ecr-access`  
**Type**: Inline policy attached to deployment user

**Permissions**:
```yaml
Actions:
  - ecr:CreateRepository
  - ecr:DescribeRepositories
  - ecr:ListImages
  - ecr:GetDownloadUrlForLayer
  - ecr:BatchGetImage
  - ecr:PutImage
  - ecr:InitiateLayerUpload
  - ecr:UploadLayerPart
  - ecr:CompleteLayerUpload
  - ecr:GetAuthorizationToken
  - ecr:DeleteRepository

Resource: "*"
```

#### 5. VPC Access Policy

**Policy Name**: `job-analyzer-vpc-access`  
**Type**: Inline policy attached to deployment user

**Permissions**:
```yaml
Actions:
  - ec2:CreateSecurityGroup
  - ec2:DescribeSecurityGroups
  - ec2:DeleteSecurityGroup
  - ec2:AuthorizeSecurityGroupIngress
  - ec2:AuthorizeSecurityGroupEgress
  - ec2:RevokeSecurityGroupIngress
  - ec2:RevokeSecurityGroupEgress
  - ec2:DescribeVpcs
  - ec2:DescribeSubnets
  - ec2:DescribeNetworkInterfaces

Resource: "*"
```

#### 6. CloudFormation Access Policy

**Policy Name**: `job-analyzer-cloudformation-access`  
**Type**: Inline policy attached to deployment user

**Permissions**:
```yaml
Stack Operations:
  Actions:
    - cloudformation:CreateStack
    - cloudformation:UpdateStack
    - cloudformation:DeleteStack
    - cloudformation:DescribeStacks
    - cloudformation:ListStacks
    - cloudformation:DescribeStackEvents
    - cloudformation:DescribeStackResource
    - cloudformation:GetTemplate
    - cloudformation:ValidateTemplate
  Resource: arn:aws:cloudformation:*:*:stack/job-analyzer-*

IAM Operations:
  Actions:
    - iam:PassRole
    - iam:GetRole
    - iam:ListRolePolicies
  Resource: "*"
```

### Custom Policies for Service Roles

All policies are defined in `infra/cloudformation/service-roles.yml`.

#### 7. App Runner S3 Access Policy

**Policy Name**: `job-analyzer-app-runner-s3-access`  
**Attached To**: App Runner Instance Role

**Permissions**: S3 read/write/delete for `job-analyzer-*` buckets

#### 8. App Runner RDS Access Policy

**Policy Name**: `job-analyzer-app-runner-rds-access`  
**Attached To**: App Runner Instance Role

**Permissions**: RDS IAM database authentication

#### 9. App Runner ECR Access Policy

**Policy Name**: `job-analyzer-app-runner-ecr-access`  
**Attached To**: App Runner Instance Role

**Permissions**: ECR image pulling

#### 10. App Runner Secrets Access Policy

**Policy Name**: `job-analyzer-app-runner-secrets-access`  
**Attached To**: App Runner Instance Role

**Permissions**: Secrets Manager read access for `job-analyzer/*` secrets

---

## CloudFormation Stacks

### 1. IAM Setup Stack

**Stack Name**: `job-analyzer-iam`  
**Template**: `infra/cloudformation/iam-setup.yml`  
**Status**: CREATE_COMPLETE  
**Created**: Initial IAM setup (Tasks 1.2-1.4)

**Resources Created**:
- IAM User: `job-analyzer-dev`
- Access Keys for deployment user
- 6 custom IAM policies (RDS, S3, App Runner, ECR, VPC, CloudFormation)
- App Runner Execution Role (legacy, superseded by service-roles stack)

**Outputs**:
- DeploymentUserName
- DeploymentUserArn
- AccessKeyId (⚠️ Sensitive)
- SecretAccessKey (⚠️ Sensitive)
- AppRunnerExecutionRoleArn

**Deployment Command**:
```bash
aws cloudformation create-stack \
  --stack-name job-analyzer-iam \
  --template-body file://infra/cloudformation/iam-setup.yml \
  --capabilities CAPABILITY_NAMED_IAM
```

### 2. Service Roles Stack

**Stack Name**: `job-analyzer-service-roles`  
**Template**: `infra/cloudformation/service-roles.yml`  
**Status**: CREATE_COMPLETE  
**Created**: Task 1.5

**Resources Created**:
- App Runner Instance Role
- App Runner Access Role
- RDS Enhanced Monitoring Role
- CloudFormation Service Role
- Lambda Execution Role
- 4 custom IAM policies for service roles

**Outputs**:
- AppRunnerInstanceRoleArn
- AppRunnerAccessRoleArn
- RDSEnhancedMonitoringRoleArn
- CloudFormationServiceRoleArn
- LambdaExecutionRoleArn

**Deployment Command**:
```bash
./scripts/deploy-service-roles.sh
# Or manually:
aws cloudformation create-stack \
  --stack-name job-analyzer-service-roles \
  --template-body file://infra/cloudformation/service-roles.yml \
  --capabilities CAPABILITY_NAMED_IAM
```

### 3. S3 Setup Stack

**Stack Name**: `job-analyzer-s3`  
**Template**: `infra/cloudformation/s3-setup.yml`  
**Status**: CREATE_COMPLETE  
**Created**: Task 4 (S3 Bucket Setup)

**Resources Created**:
- S3 Bucket: `job-analyzer-files`
- Bucket encryption (AES256)
- Versioning enabled
- Public access blocked
- CORS configuration for web uploads
- Lifecycle rules (90-day version deletion, 30-day IA transition)
- Bucket policy for App Runner access

**Outputs**:
- BucketName: `job-analyzer-files`
- BucketArn: `arn:aws:s3:::job-analyzer-files`
- BucketDomainName: `job-analyzer-files.s3.amazonaws.com`
- BucketRegionalDomainName: `job-analyzer-files.s3.us-east-1.amazonaws.com`

**Deployment Command**:
```bash
./scripts/deploy-s3.sh
# Or manually:
aws cloudformation create-stack \
  --stack-name job-analyzer-s3 \
  --template-body file://infra/cloudformation/s3-setup.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=job-analyzer
```

---

## Security Configuration

### Principle of Least Privilege

All IAM policies follow the principle of least privilege:

✅ **Resource Scoping**: Policies are scoped to specific resources using ARN patterns  
✅ **Action Restrictions**: Only necessary actions are granted  
✅ **No Wildcards**: Avoid `*` in actions unless required by AWS services  
✅ **Region Restrictions**: Operations limited to `us-east-1` where applicable  
✅ **Custom Policies**: Use custom policies instead of AWS managed `*FullAccess` policies

### Trust Relationships

All service roles have strict trust relationships:

- **App Runner Instance Role**: Only `tasks.apprunner.amazonaws.com` can assume
- **App Runner Access Role**: Only `build.apprunner.amazonaws.com` can assume
- **RDS Monitoring Role**: Only `monitoring.rds.amazonaws.com` can assume
- **CloudFormation Service Role**: Only `cloudformation.amazonaws.com` can assume
- **Lambda Execution Role**: Only `lambda.amazonaws.com` can assume

### MFA Requirements

- ✅ Root account: MFA enabled
- ✅ Admin user: MFA enabled for console access
- ✅ Deployment user: Programmatic access only (no console)

### Access Key Rotation

- **Current Policy**: Manual rotation as needed
- **Recommendation**: Implement 90-day rotation policy
- **Process**: Generate new keys → Update `.env` → Delete old keys

### Audit and Monitoring

- **CloudTrail**: Enabled for all API calls
- **CloudWatch**: Logs for all services
- **IAM Access Analyzer**: Recommended for periodic reviews
- **Cost Allocation Tags**: All resources tagged for tracking

---

## Credential Storage

### Secure Storage Locations

#### 1. Password Manager

**Stored Credentials**:
- AWS Account ID
- Root user email and password
- Admin user credentials
- Deployment user access keys
- All CloudFormation stack outputs

**Access**: Solo developer only

#### 2. Local `.env` File

**Location**: Project root (`.env`)  
**Git Status**: ✅ Ignored (in `.gitignore`)  
**Permissions**: `600` (owner read/write only)

**Contents**:
```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
AWS_ACCOUNT_ID=...

# CloudFormation Stack Info
CF_STACK_NAME=job-analyzer-iam
CF_ENVIRONMENT=job-analyzer
```

#### 3. AWS CLI Configuration

**Location**: `~/.aws/credentials` and `~/.aws/config`  
**Profile Name**: `job-analyzer`

**Configuration**:
```ini
# ~/.aws/credentials
[job-analyzer]
aws_access_key_id = AKIA...
aws_secret_access_key = ...

# ~/.aws/config
[profile job-analyzer]
region = us-east-1
output = json
```

#### 4. Future: AWS Secrets Manager

**Plan**: Store application secrets in Secrets Manager (Task 2+)  
**Naming Convention**: `job-analyzer/{environment}/{secret-name}`  
**Access**: Via App Runner Instance Role

### Security Best Practices

❌ **NEVER**:
- Commit credentials to version control
- Share credentials via email or chat
- Store credentials in plain text files (except `.env` which is gitignored)
- Use root user for daily operations
- Share access keys between users

✅ **ALWAYS**:
- Use password manager for credential storage
- Enable MFA on all human users
- Rotate access keys regularly
- Use IAM roles for service-to-service communication
- Review and audit permissions quarterly

---

## Service Relationships

### Permission Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Account                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  IAM Users                                             │ │
│  │                                                        │ │
│  │  ┌──────────────────────┐                            │ │
│  │  │ job-analyzer-dev     │                            │ │
│  │  │ (Deployment User)    │                            │ │
│  │  │                      │                            │ │
│  │  │ Policies:            │                            │ │
│  │  │ • RDS Access         │                            │ │
│  │  │ • S3 Access          │                            │ │
│  │  │ • ECR Access         │                            │ │
│  │  │ • App Runner Access  │                            │ │
│  │  │ • VPC Access         │                            │ │
│  │  │ • CloudFormation     │                            │ │
│  │  └──────────────────────┘                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  IAM Roles                                             │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ App Runner Instance Role                         │ │ │
│  │  │ Trust: tasks.apprunner.amazonaws.com             │ │ │
│  │  │                                                  │ │ │
│  │  │ Permissions:                                     │ │ │
│  │  │ • S3 (read/write)    ──────────┐                │ │ │
│  │  │ • RDS (connect)      ──────────┼────┐           │ │ │
│  │  │ • ECR (pull images)  ──────────┼────┼───┐       │ │ │
│  │  │ • Secrets Manager    ──────────┼────┼───┼───┐   │ │ │
│  │  │ • CloudWatch Logs    ──────────┼────┼───┼───┼─┐ │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                    │    │   │   │   │  │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ App Runner Access Role                           │ │ │
│  │  │ Trust: build.apprunner.amazonaws.com             │ │ │
│  │  │ Permissions: ECR (pull for builds)               │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ RDS Enhanced Monitoring Role                     │ │ │
│  │  │ Trust: monitoring.rds.amazonaws.com              │ │ │
│  │  │ Permissions: CloudWatch (publish metrics)        │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                    │    │   │   │   │       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AWS Services                   │    │   │   │   │     │ │
│  │                                 ▼    ▼   ▼   ▼   ▼     │ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐   │ │
│  │  │  S3  │  │ RDS  │  │ ECR  │  │Secret│  │Cloud │   │ │
│  │  │      │  │      │  │      │  │Mgr   │  │Watch │   │ │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Service Communication Matrix

| From Service | To Service | Via Role/Policy | Purpose |
|-------------|------------|-----------------|---------|
| Developer | All Services | Deployment User Policies | Infrastructure management |
| App Runner | S3 | App Runner Instance Role | File storage access |
| App Runner | RDS | App Runner Instance Role | Database connections |
| App Runner | ECR | App Runner Access Role | Pull container images |
| App Runner | Secrets Manager | App Runner Instance Role | Retrieve credentials |
| App Runner | CloudWatch | App Runner Instance Role | Write logs |
| RDS | CloudWatch | RDS Monitoring Role | Publish metrics |
| CloudFormation | All Services | CloudFormation Service Role | Infrastructure provisioning |

---

## Resource Naming Conventions

### Pattern

All resources follow the pattern: `{environment}-{resource-type}-{purpose}`

### Examples

**IAM Resources**:
- User: `job-analyzer-dev`
- Role: `job-analyzer-app-runner-instance-role`
- Policy: `job-analyzer-rds-access`

**CloudFormation Stacks**:
- `job-analyzer-iam`
- `job-analyzer-service-roles`
- `job-analyzer-rds` (future)
- `job-analyzer-s3` (future)

**S3 Buckets** (future):
- `job-analyzer-app-files`
- `job-analyzer-resumes`

**ECR Repositories** (future):
- `job-analyzer-app`

**RDS Instances** (future):
- `job-analyzer-db`

### Tags

All resources are tagged with:
- **Environment**: `job-analyzer`
- **Project**: `job-posting-analyzer`
- **Purpose**: Specific purpose of the resource
- **ManagedBy**: `CloudFormation`

---

## Access Control Matrix

### Deployment User Permissions

| Service | Create | Read | Update | Delete | Scope |
|---------|--------|------|--------|--------|-------|
| RDS | ✅ | ✅ | ✅ | ✅ | us-east-1 only |
| S3 | ✅ | ✅ | ✅ | ✅ | job-analyzer-* buckets |
| ECR | ✅ | ✅ | ✅ | ✅ | All repositories |
| App Runner | ✅ | ✅ | ✅ | ✅ | All services |
| VPC/Security Groups | ✅ | ✅ | ✅ | ✅ | All VPCs |
| CloudFormation | ✅ | ✅ | ✅ | ✅ | job-analyzer-* stacks |

### App Runner Instance Role Permissions

| Service | Create | Read | Update | Delete | Scope |
|---------|--------|------|--------|--------|-------|
| S3 | ❌ | ✅ | ✅ | ✅ | job-analyzer-* buckets |
| RDS | ❌ | ❌ | ❌ | ❌ | Connect only |
| ECR | ❌ | ✅ | ❌ | ❌ | Pull images only |
| Secrets Manager | ❌ | ✅ | ❌ | ❌ | job-analyzer/* secrets |
| CloudWatch | ❌ | ❌ | ✅ | ❌ | Write logs only |

---

## Verification Commands

### Verify IAM User

```bash
# Check caller identity
aws sts get-caller-identity --profile job-analyzer

# List attached policies
aws iam list-attached-user-policies --user-name job-analyzer-dev

# List inline policies
aws iam list-user-policies --user-name job-analyzer-dev
```

### Verify IAM Roles

```bash
# List all roles
aws iam list-roles --query 'Roles[?contains(RoleName, `job-analyzer`)].RoleName'

# Get specific role
aws iam get-role --role-name job-analyzer-app-runner-instance-role

# List role policies
aws iam list-attached-role-policies --role-name job-analyzer-app-runner-instance-role
```

### Verify CloudFormation Stacks

```bash
# List stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE

# Get stack details
aws cloudformation describe-stacks --stack-name job-analyzer-iam

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name job-analyzer-service-roles \
  --query 'Stacks[0].Outputs'
```

### Test Service Permissions

```bash
# Test RDS
aws rds describe-db-instances --profile job-analyzer

# Test S3
aws s3 ls --profile job-analyzer

# Test ECR
aws ecr describe-repositories --profile job-analyzer

# Test App Runner
aws apprunner list-services --profile job-analyzer
```

---

## Maintenance and Updates

### Regular Tasks

**Monthly**:
- Review IAM Access Analyzer findings
- Check CloudTrail logs for unusual activity
- Review cost allocation by tags

**Quarterly**:
- Rotate access keys
- Review and update IAM policies
- Audit unused roles and policies
- Update this documentation

**Annually**:
- Comprehensive security audit
- Review and update ADRs
- Update disaster recovery procedures

### Update Procedures

**To Update IAM Policies**:
1. Modify CloudFormation template
2. Validate template: `aws cloudformation validate-template`
3. Update stack: `aws cloudformation update-stack`
4. Verify changes in IAM console
5. Update this documentation
6. Commit changes to git

**To Add New Resources**:
1. Follow IaC guidelines in `.kiro/steering/infrastructure-as-code.md`
2. Create or update CloudFormation template
3. Deploy via automated script
4. Document in this file
5. Update service relationship diagram

---

## Related Documentation

- [ADR-002: CloudFormation for IaC](../adr/002-cloudformation-for-iac.md)
- [IaC Steering Rule](../../.kiro/steering/infrastructure-as-code.md)
- [CloudFormation README](../../infra/cloudformation/README.md)
- [Service Roles Documentation](../../infra/cloudformation/SERVICE_ROLES.md)
- [Task 1.5 Implementation Summary](../implementation/task-1.5-service-roles.md)

---

## Emergency Contacts

**AWS Support**: [AWS Support Center](https://console.aws.amazon.com/support/)  
**Account Owner**: [Contact information in password manager]  
**Billing Issues**: [Billing console](https://console.aws.amazon.com/billing/)

---

## Document History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-13 | 1.0 | Initial documentation | Task 1.8 |

---

**⚠️ SECURITY NOTICE**: This document contains references to sensitive resources. Store securely and share only with authorized team members. Never commit actual credentials or ARNs to version control.
