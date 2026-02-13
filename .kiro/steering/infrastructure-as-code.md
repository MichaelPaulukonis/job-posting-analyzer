---
description: Guidelines for AWS infrastructure management using Infrastructure as Code (CloudFormation)
globs: infra/**, scripts/**, docs/adr/**, .taskmaster/**
alwaysApply: true
---

# Infrastructure as Code (IaC) Guidelines

## Core Principle

**Always prefer Infrastructure as Code (CloudFormation) over manual AWS Console operations or CLI commands for infrastructure provisioning.**

## When to Use CloudFormation

Use CloudFormation templates for:

- ✅ IAM roles, policies, and users
- ✅ RDS database instances and configurations
- ✅ S3 buckets and bucket policies
- ✅ ECR repositories
- ✅ App Runner services
- ✅ VPC, subnets, and security groups
- ✅ Secrets Manager secrets
- ✅ CloudWatch alarms and dashboards
- ✅ Lambda functions and layers
- ✅ Any AWS resource that will persist beyond development

## When CLI/Console is Acceptable

Use AWS CLI or Console only for:

- ❌ One-time account setup (root user, initial admin user)
- ❌ Temporary testing/debugging
- ❌ Retrieving information (describe, list commands)
- ❌ Emergency fixes in production (document and backport to IaC)

## CloudFormation Best Practices

### Template Organization

```
infra/
├── cloudformation/
│   ├── README.md                    # Deployment instructions
│   ├── iam-setup.yml               # IAM users and deployment policies
│   ├── service-roles.yml           # IAM roles for service-to-service
│   ├── rds-setup.yml               # Database infrastructure
│   ├── s3-setup.yml                # Storage buckets
│   ├── ecr-setup.yml               # Container registry
│   └── app-runner-setup.yml        # Application deployment
└── scripts/
    ├── deploy-*.sh                  # Automated deployment scripts
    └── validate-*.sh                # Template validation scripts
```

### Template Structure

- **Parameters**: Use for environment-specific values (EnvironmentName, etc.)
- **Resources**: Define all AWS resources with proper naming and tagging
- **Outputs**: Export ARNs and resource IDs for cross-stack references
- **Tags**: Always tag resources with Environment, Project, Purpose

### Naming Conventions

- **Stacks**: `{project}-{resource-type}` (e.g., `job-analyzer-iam`)
- **Resources**: `{EnvironmentName}-{resource-type}-{purpose}` (e.g., `job-analyzer-app-runner-instance-role`)
- **Exports**: `{EnvironmentName}-{resource-type}-{identifier}` (e.g., `job-analyzer-app-runner-instance-role-arn`)

### Security Principles

- **Least Privilege**: Grant only necessary permissions
- **Resource Scoping**: Use ARN patterns to limit access (e.g., `arn:aws:s3:::${EnvironmentName}-*`)
- **No Wildcards**: Avoid `*` in actions unless absolutely necessary
- **Trust Relationships**: Limit role assumption to specific AWS services
- **Tagging**: Tag all resources for tracking and cost allocation

## Deployment Workflow

### 1. Create Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Brief description of what this template creates'

Parameters:
  EnvironmentName:
    Type: String
    Default: 'job-analyzer'
    Description: 'Environment name for resource tagging'

Resources:
  # Define resources here

Outputs:
  # Export important values here
```

### 2. Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://template.yml
```

### 3. Create Deployment Script

```bash
#!/bin/bash
# scripts/deploy-{resource}.sh

STACK_NAME="job-analyzer-{resource}"
TEMPLATE_FILE="infra/cloudformation/{resource}-setup.yml"

# Validate
aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE

# Deploy
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://$TEMPLATE_FILE \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=EnvironmentName,ParameterValue=job-analyzer

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME

# Display outputs
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs'
```

### 4. Document

Create comprehensive documentation:
- Template purpose and resources
- Deployment instructions
- Security considerations
- Troubleshooting guide
- Usage examples

## Task Implementation Pattern

When implementing infrastructure tasks:

1. **Check Existing Templates**: Review existing CloudFormation templates first
2. **Extend or Create**: Either extend existing template or create new one
3. **Follow Conventions**: Use established naming and tagging patterns
4. **Automate Deployment**: Create deployment and validation scripts
5. **Document Thoroughly**: Update README and create detailed docs
6. **Test Validation**: Validate template syntax before deployment
7. **Deploy to AWS**: Use automated scripts for deployment
8. **Verify Resources**: Confirm resources exist in AWS Console/CLI
9. **Update Task**: Document implementation in task management system
10. **Commit Changes**: Commit all IaC files with descriptive message

## Example: Adding a New Resource

```yaml
# In existing or new template
NewResource:
  Type: AWS::Service::ResourceType
  Properties:
    ResourceName: !Sub '${EnvironmentName}-resource-name'
    # ... other properties
    Tags:
      - Key: Environment
        Value: !Ref EnvironmentName
      - Key: Project
        Value: job-posting-analyzer
      - Key: Purpose
        Value: Brief description
```

## Cross-Stack References

Use CloudFormation exports for cross-stack dependencies:

```yaml
# In stack A - Export
Outputs:
  RoleArn:
    Value: !GetAtt MyRole.Arn
    Export:
      Name: !Sub '${EnvironmentName}-my-role-arn'

# In stack B - Import
Resources:
  MyResource:
    Type: AWS::Service::Resource
    Properties:
      RoleArn: !ImportValue 'job-analyzer-my-role-arn'
```

## Version Control

- ✅ Commit all CloudFormation templates to git
- ✅ Commit deployment and validation scripts
- ✅ Commit documentation
- ❌ Never commit credentials or secrets
- ❌ Never commit `.env` files with API keys

## Troubleshooting

### Stack Creation Failed

```bash
# View stack events
aws cloudformation describe-stack-events \
  --stack-name {stack-name} \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Delete failed stack
aws cloudformation delete-stack --stack-name {stack-name}
```

### Update Stack

```bash
# Update existing stack
aws cloudformation update-stack \
  --stack-name {stack-name} \
  --template-body file://template.yml \
  --capabilities CAPABILITY_NAMED_IAM
```

### Rollback

```bash
# CloudFormation automatically rolls back on failure
# To manually rollback:
aws cloudformation cancel-update-stack --stack-name {stack-name}
```

## References

- [ADR-002: CloudFormation for IaC](../../docs/adr/002-cloudformation-for-iac.md)
- [AWS CloudFormation Best Practices](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)
- [CloudFormation Template Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-reference.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

## Decision Tree

When implementing AWS infrastructure:

```
Is this a persistent AWS resource?
├─ Yes → Use CloudFormation
│   ├─ Does template exist?
│   │   ├─ Yes → Extend existing template
│   │   └─ No → Create new template
│   ├─ Create/update deployment script
│   ├─ Document thoroughly
│   └─ Deploy and verify
└─ No → Is it temporary/testing?
    ├─ Yes → CLI/Console acceptable (document if needed)
    └─ No → Reconsider - probably should be IaC
```

## Anti-Patterns to Avoid

- ❌ Creating resources manually in AWS Console without IaC
- ❌ Using CLI commands for persistent infrastructure
- ❌ Hardcoding values instead of using parameters
- ❌ Not tagging resources
- ❌ Using overly permissive IAM policies
- ❌ Not documenting deployment procedures
- ❌ Skipping template validation
- ❌ Not using version control for templates

## Success Criteria

Infrastructure is properly managed when:

- ✅ All persistent resources defined in CloudFormation
- ✅ Templates are validated and deployable
- ✅ Deployment is automated with scripts
- ✅ Documentation is comprehensive
- ✅ Resources follow naming conventions
- ✅ Security best practices are followed
- ✅ Changes are version controlled
- ✅ Resources can be recreated from templates alone
