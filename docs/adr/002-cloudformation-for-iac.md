# ADR-002: Use CloudFormation for Infrastructure as Code

**Date**: February 1, 2026  
**Status**: Accepted  
**Deciders**: Michael (Solo Developer)  
**Related**: ADR-001 (Firebase to AWS Migration)

## Context

The AWS migration (ADR-001) requires setting up infrastructure including:

- IAM roles and policies
- RDS PostgreSQL database
- S3 buckets  
- ECR container registry
- App Runner service

This requires a decision on Infrastructure as Code (IaC) tooling. The developer is proficient in Terraform but seeks learning exposure to CloudFormation.

### Current Situation

- **Developer experience**: Terraform (preferred), learning CloudFormation
- **Project scope**: Single-account AWS setup for a portfolio project
- **Timeline**: 4-week migration plan
- **Team size**: Solo developer

## Decision

**Use CloudFormation for AWS-native infrastructure, with consideration for Terraform in future phases.**

### Implementation Strategy

#### Phase 1 (Task 1): CloudFormation

- Create CloudFormation templates for:
  - IAM user and access keys
  - IAM roles for service communication
  - IAM policies for RDS, S3, App Runner, ECR access
- Template location: `infra/cloudformation/iam-setup.yml`
- Deployment: AWS CLI (`aws cloudformation create-stack`)

#### Phase 2+ (Tasks 2-10): Evaluate & Decide

- **Option A**: Continue CloudFormation for RDS, S3, VPC, App Runner
- **Option B**: Migrate to Terraform for consistency and state management
- **Option C**: Hybrid approach (CF for AWS-specific, Terraform for application layer)
- Decision gate after Task 1 completion

## Rationale

### Why CloudFormation for Phase 1

**Advantages:**

1. **AWS-native** - CloudFormation is AWS's native IaC tool; best for AWS-specific resources
2. **IAM expertise** - IAM is CloudFormation's strength; excellent learning opportunity
3. **No state management complexity** - Task 1 is simple enough to avoid state file complications
4. **Portfolio value** - Demonstrates AWS proficiency to potential employers
5. **Hands-on learning** - Small scope (IAM) makes learning curve manageable

**Disadvantages:**

1. **Less portable** - CF templates specific to AWS (vs Terraform's multi-cloud)
2. **Learning overhead** - New syntax and concepts for Terraform user
3. **YAML/JSON limitations** - Less flexible than HCL for complex logic
4. **Tool switching** - May need to switch to Terraform later

### Why Reconsider After Phase 1

**Terraform advantages emerge at scale:**

1. **State management** - Better handling for multi-resource deployments (Tasks 2+)
2. **DRY principles** - HCL modules reduce repetition across RDS, S3, App Runner
3. **Consistency** - Single tool for all infrastructure (if adopting Terraform)
4. **Developer preference** - Already experienced with Terraform

## Consequences

### Positive ✅

1. **CloudFormation competency** - Hands-on experience with AWS's native IaC tool
2. **AWS best practices** - Learn how AWS recommends organizing infrastructure
3. **Focused learning** - IAM setup is an ideal, low-risk introduction to CloudFormation
4. **Resume value** - AWS-specific skills attractive to employers
5. **Reusable template** - IAM template can be used for future AWS projects
6. **Future flexibility** - Can still pivot to Terraform after Task 1 if desired
7. **Hands-on understanding** - Manual execution via CLI teaches AWS fundamentals

### Negative ⚠️

1. **Learning overhead** - Time investment to learn CloudFormation syntax and concepts
2. **Workflow disruption** - May need to switch to Terraform for later tasks
3. **Limited transferability** - CF knowledge doesn't transfer to multi-cloud scenarios
4. **Debugging complexity** - CF stack errors can be cryptic vs Terraform's messaging
5. **No state management this early** - Won't gain experience with Terraform state handling immediately
6. **Potential rework** - If switching to Terraform later, may need to rewrite Phase 1 templates

### Neutral ○

1. **Single-account scope** - Keeps complexity manageable regardless of tool choice
2. **Portfolio project** - Stakes are low; good environment to experiment with new tools
3. **No multi-team coordination** - State management less critical than in team environments

## Alternatives Considered

### 1. Use Terraform for Everything (Phase 1-10)

**Rejected because:**

- Misses opportunity to learn CloudFormation
- Terraform is already known; less learning value
- Overkill for simple IAM setup in Phase 1

### 2. Use CloudFormation Everywhere (Phase 1-10)

**Rejected because:**

- CF state management becomes problematic at scale
- Less ideal for multi-resource orchestration (Tasks 2-10)
- HCL modules in Terraform more maintainable for larger projects

### 3. Use AWS CDK (TypeScript)

**Rejected because:**

- Additional learning curve (CDK + CloudFormation)
- TypeScript-focused; this project is Nuxt/Node
- Overkill for single-account, learning-focused project
- Reduces AWS fundamentals understanding

### 4. Manual AWS Console Setup (No IaC)

**Rejected because:**

- Defeats purpose of learning IaC
- Not reproducible
- No portfolio value

## Implementation Plan

### Immediate (This Session)

1. Create `infra/` directory structure
2. Create `infra/cloudformation/iam-setup.yml` template
3. Define IAM user, access keys, roles, policies
4. Document credentials securely (not in git)

### Phase 1 (Task 1)

1. Validate CloudFormation template syntax
2. Deploy to AWS account: `aws cloudformation create-stack`
3. Test IAM user access with AWS CLI
4. Document all resource ARNs and configurations

### Phase 1→2 Transition (After Task 1)

1. Review CloudFormation experience
2. Decide: Continue CF, pivot to Terraform, or hybrid?
3. Adjust strategy based on learnings

## Related Documents

- **ADR-001**: Firebase to AWS Migration strategy
- **Plan**: [docs/plans/25.aws-migration.md](../plans/25.aws-migration.md)
- **Task**: Task 1 - AWS Account and IAM Setup (aws-migration tag)

## References

- [AWS CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/)
- [CloudFormation Best Practices](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
