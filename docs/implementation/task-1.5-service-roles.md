# Task 1.5: Create IAM Roles for Services - Implementation Summary

**Task ID**: 1.5 (Subtask 5 of Task 1)  
**Status**: Implementation Complete (Pending Deployment)  
**Date**: February 12, 2026  
**Approach**: Infrastructure as Code (CloudFormation)

## Overview

Implemented comprehensive IAM service roles using CloudFormation to enable secure communication between AWS services following the principle of least privilege and AWS security best practices.

## Deliverables

### 1. CloudFormation Template
**File**: `infra/cloudformation/service-roles.yml`

Creates 5 IAM roles with associated policies:

#### App Runner Instance Role
- **Purpose**: Runtime permissions for App Runner service
- **Trust**: `tasks.apprunner.amazonaws.com`
- **Permissions**:
  - S3: Read/write/delete in `job-analyzer-*` buckets
  - RDS: IAM database authentication
  - ECR: Pull container images
  - Secrets Manager: Retrieve credentials
  - CloudWatch Logs: Write application logs

#### App Runner Access Role
- **Purpose**: ECR image pulling during deployment
- **Trust**: `build.apprunner.amazonaws.com`
- **Permissions**: AWS managed policy `AWSAppRunnerServicePolicyForECRAccess`

#### RDS Enhanced Monitoring Role
- **Purpose**: Publish RDS metrics to CloudWatch
- **Trust**: `monitoring.rds.amazonaws.com`
- **Permissions**: AWS managed policy `AmazonRDSEnhancedMonitoringRole`

#### CloudFormation Service Role
- **Purpose**: Manage infrastructure resources
- **Trust**: `cloudformation.amazonaws.com`
- **Permissions**:
  - IAM: Create/manage roles and policies
  - RDS: Full management
  - S3: Bucket and object management
  - ECR: Repository management
  - App Runner: Service management
  - VPC: Security group management
  - Secrets Manager: Secret management

#### Lambda Execution Role
- **Purpose**: Future serverless functions
- **Trust**: `lambda.amazonaws.com`
- **Permissions**:
  - Basic Lambda execution (CloudWatch Logs)
  - VPC access
  - RDS database connections
  - S3 object operations
  - Secrets Manager access

### 2. Deployment Automation
**File**: `scripts/deploy-service-roles.sh`

Features:
- Template validation before deployment
- Automatic detection of create vs. update operations
- Progress monitoring with clear status messages
- Error handling and troubleshooting guidance
- Displays role ARNs after successful deployment

### 3. Validation Script
**File**: `scripts/validate-service-roles.sh`

Features:
- Syntax validation
- Resource counting and listing
- Capability requirements detection
- Deployment instructions

### 4. Comprehensive Documentation
**File**: `infra/cloudformation/SERVICE_ROLES.md`

Includes:
- Detailed role descriptions and use cases
- Trust relationships and permissions breakdown
- Deployment instructions with examples
- Security best practices
- Troubleshooting guide
- Usage examples for each role
- Verification commands

### 5. Updated Main Documentation
**File**: `infra/cloudformation/README.md`

Added Task 1.8 with service roles deployment instructions.

## Security Implementation

### Principle of Least Privilege
✅ Resource-scoped permissions using ARN patterns  
✅ Specific actions instead of wildcards  
✅ Service-specific trust relationships  
✅ No overly permissive policies

### Resource Scoping Examples
```yaml
# S3 - Scoped to environment buckets
Resource: arn:aws:s3:::job-analyzer-*

# ECR - Scoped to environment repositories
Resource: arn:aws:ecr:*:*:repository/job-analyzer-*

# Secrets - Scoped to environment secrets
Resource: arn:aws:secretsmanager:*:*:secret:job-analyzer/*
```

### Trust Relationships
Each role can only be assumed by specific AWS services:
- App Runner roles → `tasks.apprunner.amazonaws.com`
- RDS monitoring → `monitoring.rds.amazonaws.com`
- Lambda → `lambda.amazonaws.com`
- CloudFormation → `cloudformation.amazonaws.com`

## Validation Results

Template validation successful:
- ✅ Syntax: Valid CloudFormation YAML
- ✅ Resources: 11 resources (5 roles, 6 policies)
- ✅ Parameters: 1 parameter (EnvironmentName)
- ✅ Outputs: 5 role ARN exports
- ✅ Capabilities: CAPABILITY_NAMED_IAM required

## Deployment Instructions

### Quick Start
```bash
# Validate template
./scripts/validate-service-roles.sh

# Deploy stack
./scripts/deploy-service-roles.sh
```

### Manual Deployment
```bash
# Create stack
aws cloudformation create-stack \
  --stack-name job-analyzer-service-roles \
  --template-body file://infra/cloudformation/service-roles.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=job-analyzer \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name job-analyzer-service-roles

# Get role ARNs
aws cloudformation describe-stacks \
  --stack-name job-analyzer-service-roles \
  --query 'Stacks[0].Outputs'
```

## Integration Points

### With Existing Infrastructure
- Complements `iam-setup.yml` (user and deployment policies)
- Uses same naming conventions (`job-analyzer-*`)
- Consistent tagging strategy
- Same parameter structure

### With Future Infrastructure
These roles will be used by:
- **Task 2**: RDS setup (monitoring role)
- **Task 4**: S3 setup (App Runner access)
- **Task 10**: App Runner deployment (instance and access roles)
- **Future**: Lambda functions (execution role)

## Testing Strategy

### Pre-Deployment Testing
✅ Template syntax validation  
✅ Resource type verification  
✅ Parameter validation  
✅ Output structure verification

### Post-Deployment Testing
To be performed after deployment:
1. Verify roles exist in IAM console
2. Check trust relationships
3. Validate attached policies
4. Test role assumption with appropriate services
5. Verify CloudWatch logging
6. Check resource tagging

### Verification Commands
```bash
# List created roles
aws iam list-roles \
  --query 'Roles[?contains(RoleName, `job-analyzer`)].RoleName'

# Get role details
aws iam get-role --role-name job-analyzer-app-runner-instance-role

# List attached policies
aws iam list-attached-role-policies \
  --role-name job-analyzer-app-runner-instance-role

# Get inline policy
aws iam get-role-policy \
  --role-name job-analyzer-app-runner-instance-role \
  --policy-name job-analyzer-app-runner-s3-access
```

## Next Steps

1. **Deploy the Stack**
   ```bash
   ./scripts/deploy-service-roles.sh
   ```

2. **Save Role ARNs**
   - Document ARNs from stack outputs
   - Store in `.env` or parameter store
   - Reference in subsequent infrastructure templates

3. **Use in Downstream Tasks**
   - Task 2 (RDS): Use monitoring role ARN
   - Task 4 (S3): Configure bucket policies for App Runner role
   - Task 10 (App Runner): Use instance and access role ARNs

4. **Verify Deployment**
   - Check IAM console for roles
   - Test trust relationships
   - Validate permissions

## Files Created

```
infra/cloudformation/
├── service-roles.yml          # CloudFormation template
└── SERVICE_ROLES.md           # Detailed documentation

scripts/
├── deploy-service-roles.sh    # Deployment automation
└── validate-service-roles.sh  # Validation script

docs/implementation/
└── task-1.5-service-roles.md  # This file
```

## Compliance & Best Practices

✅ **AWS Well-Architected Framework**
- Security Pillar: Least privilege, service-specific trust
- Operational Excellence: IaC, automation, documentation
- Reliability: Proper error handling, monitoring roles

✅ **IAM Best Practices**
- No wildcard permissions on sensitive actions
- Resource-based scoping
- Service-specific trust relationships
- Regular audit capability through CloudTrail

✅ **CloudFormation Best Practices**
- Parameterized templates
- Exported outputs for cross-stack references
- Comprehensive resource tagging
- Clear descriptions and documentation

## Cost Considerations

IAM roles and policies have no direct cost. Costs will be incurred by:
- Services using these roles (RDS, App Runner, etc.)
- CloudWatch Logs (if logging is enabled)
- Enhanced Monitoring (if enabled on RDS)

## Maintenance

### Regular Tasks
- Quarterly permission audits
- Review CloudTrail logs for role usage
- Update policies as service requirements change
- Remove unused roles

### Monitoring
- Enable CloudTrail for role assumption events
- Use IAM Access Analyzer to identify unused permissions
- Monitor CloudWatch for permission denied errors

## References

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [App Runner IAM Roles](https://docs.aws.amazon.com/apprunner/latest/dg/security-iam-service-with-iam.html)
- [RDS Enhanced Monitoring](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Monitoring.OS.html)
- [CloudFormation IAM Resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html)
- [ADR-002: CloudFormation for IaC](../adr/002-cloudformation-for-iac.md)

## Conclusion

Task 1.5 implementation is complete with a production-ready CloudFormation template that creates all necessary service roles following AWS security best practices. The template is validated, documented, and ready for deployment. All roles follow the principle of least privilege with appropriate resource scoping and service-specific trust relationships.
