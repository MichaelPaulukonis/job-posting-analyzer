# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant architectural and technical decisions for the Job Posting Analyzer project.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences. ADRs help:

- **Document decisions** - Create a permanent record of "why" decisions were made
- **Onboard team members** - New developers understand architectural history and constraints
- **Enable reviews** - Decisions can be critiqued and evolved as understanding grows
- **Support future choices** - Context informs similar decisions later
- **Build institutional knowledge** - Preserve reasoning beyond the original decision maker

## File Naming Convention

ADRs follow a simple naming pattern:

```
NNN-semantic-name.md
```

Where:
- **NNN** - Three-digit number (001, 002, 003, etc.), incrementing sequentially
- **semantic-name** - Hyphenated kebab-case description of the decision
- Example: `001-firebase-to-aws-migration.md`, `002-cloudformation-for-iac.md`

## Creating a New ADR

### Step 1: Copy the Template

```bash
cp docs/adr/TEMPLATE.md docs/adr/NNN-your-decision-name.md
```

### Step 2: Fill in the Template

Use the sections in `TEMPLATE.md` as your guide:

- **Date**: When the decision was made
- **Status**: Proposed, Accepted, Deprecated, or Superseded
- **Deciders**: Who made or approved the decision
- **Context**: Problem, constraints, background
- **Decision**: What was decided
- **Rationale**: Why this decision was chosen
- **Consequences**: Expected outcomes (positive, negative, neutral)
- **Validation**: How to know if the decision worked
- **Future Considerations**: When/why to revisit

### Step 3: Focus on Clarity

- Write for both technical and non-technical readers
- Include examples, diagrams, or tables when helpful
- Keep sections concise but complete
- Use the Status field to track decision state

## Decision States

### Proposed 📋
A decision has been made but not yet implemented or fully accepted. Documentation is complete; awaiting feedback or implementation.

### Accepted ✅
The decision has been made, documented, and is being implemented or already implemented. This is the working standard.

### Deprecated ⚠️
The decision is no longer recommended for new work, but existing implementations may remain. Usually superseded by a newer ADR.

### Superseded 🔄
A newer ADR has replaced this decision. Reference the newer ADR for current guidance.

## Current ADRs

### [ADR-001: Firebase to AWS Migration Strategy](001-firebase-to-aws-migration.md)
- **Status**: Proposed
- **Decision**: Migrate from Firebase to AWS (keeping Firebase Auth) to enable vector search, relational queries, and improve scalability
- **Key Points**: RDS PostgreSQL with pgvector, S3 for file storage, App Runner for hosting, 5-phase implementation plan

### [ADR-002: Use CloudFormation for Infrastructure as Code](002-cloudformation-for-iac.md)
- **Status**: Accepted  
- **Decision**: Use CloudFormation for Phase 1 (IAM setup) with decision gate for Terraform adoption in Phase 2+
- **Key Points**: AWS-native approach, good learning opportunity for IAM, hybrid tool strategy possible later

## Best Practices

1. **Write early** - Don't wait until decision is complete; document as you decide
2. **Seek input** - Share drafts with team members (or mentors) before finalizing
3. **Be honest** - Include trade-offs and downsides, not just benefits
4. **Keep related** - Cross-reference related ADRs in the "Related" section
5. **Update status** - Move ADRs from Proposed → Accepted as decisions solidify
6. **Don't delete** - Even deprecated ADRs remain for historical context
7. **Use context** - Reference the Current Situation section for future readers

## FAQ

**Q: How detailed should an ADR be?**  
A: Detailed enough to understand the decision and reasoning 6 months from now. Typically 1-3 pages.

**Q: When should I create an ADR?**  
A: For significant decisions that affect multiple components, have long-term impact, or involve trade-offs.

**Q: Who can create ADRs?**  
A: Anyone can propose an ADR, but decisions should be made by appropriate stakeholders.

**Q: What if I discover a decision was wrong?**  
A: Create a new ADR superseding the old one, explaining what changed and why.

## References

- [ADRs: Architecture Decision Records (Joel Spolsky)](https://www.joelonspolsky.com/items/2020/08/28/architecture-decision-records)
- [Architecture Decision Record (Wikipedia)](https://en.wikipedia.org/wiki/Architectural_decision)
- [ADR GitHub Organization](https://adr.github.io/)
- [ADR by Example](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/examples/)
