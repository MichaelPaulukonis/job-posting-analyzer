# CloudFormation Deployment Instructions

## Overview

This directory contains CloudFormation Infrastructure as Code (IaC) templates for deploying the Job Posting Analyzer application to AWS.

## File Structure

```
infra/
├── cloudformation/
│   ├── README.md                    # This file
│   ├── iam-setup.yml               # IAM user, roles, and policies
│   ├── rds-setup.yml               # RDS PostgreSQL with pgvector (TODO)
│   ├── s3-setup.yml                # S3 buckets for file storage (TODO)
│   ├── ecr-setup.yml               # ECR container registry (TODO)
│   └── app-runner-setup.yml        # App Runner service (TODO)
└── terraform/                       # Future: Terraform equivalents (Optional)
```

## Prerequisites

### AWS Account Setup
- AWS account with admin/sufficient permissions
- AWS CLI v2 installed: `aws --version`
- Credentials configured: `aws configure`

### Local Environment
- macOS/Linux shell (bash/zsh)
- `.env` file for storing credentials (add to `.gitignore`)

## Phase 1: IAM Setup

### Task 1.1: Validate CloudFormation Template

```bash
cd infra/cloudformation
aws cloudformation validate-template --template-body file://iam-setup.yml
```

**Expected output:** Template is valid (no errors)

### Task 1.2: Deploy IAM Stack

```bash
# Create the CloudFormation stack
aws cloudformation create-stack \
  --stack-name job-analyzer-iam \
  --template-body file://iam-setup.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=job-analyzer \
               ParameterKey=UserName,ParameterValue=job-analyzer-dev

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete --stack-name job-analyzer-iam
```

### Task 1.3: Retrieve Stack Outputs

```bash
# Get all stack outputs (including credentials)
aws cloudformation describe-stacks \
  --stack-name job-analyzer-iam \
  --query 'Stacks[0].Outputs' \
  --output table

# Or save to file for reference
aws cloudformation describe-stacks \
  --stack-name job-analyzer-iam \
  --query 'Stacks[0].Outputs' > iam-stack-outputs.json
```

### Task 1.4: Secure Credentials Storage

**CRITICAL: Never commit credentials to git**

1. Create `.env` file in project root:
```bash
cat > .env << 'EOF'
# AWS Credentials (from iam-setup stack outputs)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-1
AWS_ACCOUNT_ID=your_account_id_here

# CloudFormation Stack Info
CF_STACK_NAME=job-analyzer-iam
CF_ENVIRONMENT=job-analyzer
EOF
```

2. Add to `.gitignore` (should already be there):
```bash
echo ".env" >> .gitignore
```

3. Verify it's ignored:
```bash
git status
```

### Task 1.5: Configure AWS CLI Profile

```bash
# Create a named profile with the new credentials
aws configure --profile job-analyzer

# When prompted, enter:
# - AWS Access Key ID: [from stack outputs]
# - AWS Secret Access Key: [from stack outputs]
# - Default region: us-east-1
# - Default output format: json
```

### Task 1.6: Verify IAM User Access

```bash
# Test that the IAM user can authenticate
aws sts get-caller-identity --profile job-analyzer

# Expected output:
# {
#     "UserId": "AIDAJ...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/job-analyzer-dev"
# }
```

### Task 1.7: Test Service Permissions

```bash
# Test RDS permissions
aws rds describe-db-instances --profile job-analyzer

# Test S3 permissions
aws s3 ls --profile job-analyzer

# Test ECR permissions
aws ecr describe-repositories --profile job-analyzer

# Test App Runner permissions
aws apprunner list-services --profile job-analyzer
```

## Phase 2: Infrastructure Deployment (TODO)

After Task 1 is complete, the following templates will be created:

### RDS PostgreSQL (Task 2)
```bash
aws cloudformation create-stack \
  --stack-name job-analyzer-rds \
  --template-body file://rds-setup.yml \
  --profile job-analyzer
```

### S3 Buckets (Task 4)
```bash
aws cloudformation create-stack \
  --stack-name job-analyzer-s3 \
  --template-body file://s3-setup.yml \
  --profile job-analyzer
```

### ECR Registry (Part of Task 2)
```bash
aws cloudformation create-stack \
  --stack-name job-analyzer-ecr \
  --template-body file://ecr-setup.yml \
  --profile job-analyzer
```

### App Runner Service (Task 10)
```bash
aws cloudformation create-stack \
  --stack-name job-analyzer-app \
  --template-body file://app-runner-setup.yml \
  --profile job-analyzer
```

## Monitoring and Troubleshooting

### View Stack Status
```bash
aws cloudformation describe-stacks \
  --stack-name job-analyzer-iam \
  --profile job-analyzer
```

### View Stack Events
```bash
aws cloudformation describe-stack-events \
  --stack-name job-analyzer-iam \
  --profile job-analyzer \
  --query 'StackEvents[0:10]' \
  --output table
```

### Delete Stack (if needed)
```bash
# WARNING: This will delete all resources created by the stack
aws cloudformation delete-stack \
  --stack-name job-analyzer-iam \
  --profile job-analyzer

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name job-analyzer-iam \
  --profile job-analyzer
```

## CloudFormation Concepts Reference

- **Stack**: A collection of AWS resources managed together
- **Template**: YAML/JSON file that defines stack resources
- **Parameters**: Input values passed to the template
- **Outputs**: Values exported from the stack for reference
- **Resources**: AWS services defined in the template
- **Policies**: IAM permissions defining what actions are allowed

## Related Documentation

- **ADR**: [docs/adr/002-cloudformation-for-iac.md](../../docs/adr/002-cloudformation-for-iac.md)
- **Migration Plan**: [docs/plans/25.aws-migration.md](../../docs/plans/25.aws-migration.md)
- **Task**: Task 1 - AWS Account and IAM Setup
- **AWS CloudFormation Docs**: https://docs.aws.amazon.com/cloudformation/

## Next Steps

1. ✅ Create and validate `iam-setup.yml`
2. ✅ Deploy IAM stack to AWS
3. ✅ Verify credentials and permissions
4. 📋 Create `rds-setup.yml` for database
5. 📋 Create `s3-setup.yml` for file storage
6. 📋 Create `ecr-setup.yml` for container registry
7. 📋 Create `app-runner-setup.yml` for deployment
