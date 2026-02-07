# ADR-001: Firebase to AWS Migration Strategy

**Date**: February 1, 2026  
**Status**: Proposed  
**Deciders**: Michael (Solo Developer)

## Context

The Job Posting Analyzer currently uses Firebase Authentication for user management and persists data locally in JSON files (`.data/` directory) via a `FileStorageService` class. Existing data includes:

- **Resumes** (`resumes.json`) - Resume versions with id, name, content, timestamp
- **Analysis History** (`analysis-history.json`) - Matches, gaps, suggestions from past comparisons
- **Conversations** (`conversations.json`) - AI conversation context for cover letter generation
- **Cover Letter Samples** (`cover-letter-samples.json`) - Templates and version history

This file-based approach works for single-user development but cannot scale to production deployment or multi-device access. The current data structure is already coded throughout the application and must be preserved during migration.

As the application evolves to support semantic job search and production deployment, limitations become clear:

- **File-based storage** - Cannot support multiple users, concurrent access, or cloud deployment
- **No vector database support** - Cannot implement pgvector-based semantic search for "similar jobs" feature
- **NoSQL limitations** - If using Firestore, lacks relational querying needed for complex analysis comparisons
- **Vendor lock-in** - Firebase ecosystem creates tight coupling

The developer's stated goal is to **deepen AWS knowledge** for professional growth, making this an ideal opportunity for learning while solving real technical needs.

## Decision

**Migrate to AWS stack while keeping Firebase Auth:**

### Architecture

```mermaid
Frontend (Nuxt 3) 
    ↓
Firebase Auth (unchanged) ← Backend API (Nitro/Node)
                           ↙              ↘
                        S3          RDS PostgreSQL
                      (Files)      + pgvector
                                  (Data + Vectors)
```

### Service Selection

| Component | Service | Rationale |
|-----------|---------|-----------|
| **Hosting** | AWS App Runner | Container-native, zero DevOps, auto-scaling, perfect Nuxt fit |
| **Database** | RDS PostgreSQL 15+ | pgvector extension enables semantic search; relational data; full-text search |
| **File Storage** | S3 | Cheap, scalable, manages resume PDFs and documents |
| **Authentication** | Firebase Auth (keep) | Already working; no migration friction; Cognito can be added later |
| **Embeddings** | Existing APIs (Gemini/Anthropic) | No change; already integrated |

### Data Model

**Core tables:**

- `users` - Firebase UID mapping
- `resumes` - Resume metadata + S3 links
- `job_postings` - Job text + vector embeddings
- `analysis_results` - Comparison results, matches, gaps

**Vector search capability:**

```sql
SELECT job_id, 
       (embedding <-> query_embedding) AS distance
FROM job_postings
ORDER BY distance
LIMIT 5
```

## Consequences

### Positive ✅

1. **Semantic search enabled** - Find similar jobs using vector similarity (solves critical requirement)
2. **Relational flexibility** - Complex queries for analysis comparisons, filtering, sorting
3. **Learning & portfolio** - AWS skills valuable for career; demonstrates full-stack deployment
4. **Cost predictability** - More control over infrastructure; RDS pricing transparent
5. **No vendor lock-in** - Can migrate database independently if needed
6. **Incremental migration** - Keep Firebase Auth; move only storage/compute layers
7. **Single user simplicity** - App Runner minimal overhead for personal project

### Negative ❌

1. **Operational complexity** - More services to manage vs Firebase's all-in-one
2. **Setup time** - RDS provisioning, security groups, IAM roles require configuration
3. **Cost uncertainty** - Must monitor to avoid surprises (mitigated by free tier eligibility)
4. **Database maintenance** - Backups, upgrades, scaling decisions (manageable with RDS automation)
5. **New infrastructure** - Requires learning AWS IAM, VPC concepts, RDS management

### Neutral ↔️

1. **PostgreSQL learning curve** - Worth learning; widely used; good for portfolio
2. **Docker requirement** - Adds build step but best practice for production
3. **Multi-environment setup** - Dev (local) → Staging (optional) → Prod (App Runner)

## Alternatives Considered

### 1. Stay with Firebase + Firestore

- ❌ No pgvector support
- ❌ Expensive for vector storage at scale
- ❌ Vendor lock-in
- ✅ Zero ops, simplest setup
- **Rejected**: Cannot solve semantic search requirement

### 2. Migrate to Cognito + RDS

- ✅ Full AWS ecosystem
- ✅ More integrated security features
- ❌ Higher complexity for single-user app
- ❌ Unnecessary when Firebase Auth already works
- **Rejected**: Firebase Auth is sufficient; can migrate later if needed

### 3. Use DynamoDB instead of RDS

- ❌ No vector search (no pgvector equivalent)
- ❌ Complex queries harder to write
- ✅ Serverless, minimal ops
- **Rejected**: Cannot satisfy semantic search requirement; RDS + pgvector is better fit

### 4. Use Vercel + PostgreSQL (Vercel Postgres)

- ✅ Simpler deployment, built-in Vercel integration
- ❌ Less AWS learning opportunity
- ❌ Reduces portfolio value for AWS focus
- **Rejected**: Conflicts with goal of deepening AWS knowledge

## Implementation Phases

1. **Phase 1** (Week 1): AWS account setup, RDS provisioning, schema creation
2. **Phase 2** (Week 2): API layer (Nitro routes), S3 integration, database services
3. **Phase 3** (Week 3): Docker containerization, local testing
4. **Phase 4** (Week 4): App Runner deployment, production configuration
5. **Phase 5+** (Ongoing): Vector search features, analysis history UI, enhancements

## Rollback Plan

If migration encounters blockers:

1. **Keep Firebase Auth** - No rollback needed; authentication remains unchanged
2. **Local file storage fallback** - Can revert to local JSON storage temporarily
3. **Scale back scope** - Could do simple database without pgvector initially
4. **Hybrid approach** - Firebase for data + custom vector search later

## Monitoring & Success Metrics

- ✅ All 12 AWS migration tasks completed
- ✅ Application running on App Runner with custom domain
- ✅ Vector search working (similar job recommendations)
- ✅ Analysis history persisted and retrievable
- ✅ Portfolio-quality deployment documentation
- ✅ Infrastructure-as-code (Dockerfile, migration scripts)

## Open Questions

1. **RDS instance sizing** - Start with t4g.micro (free tier); monitor growth
2. **Vector embedding dimension** - Default 1536 (Gemini/Claude standard)
3. **Authentication layer** - Keep Firebase; add Cognito in separate ADR if needed
4. **VPC configuration** - Default VPC sufficient for single-user app
5. **Domain & SSL** - Use AWS Route 53 or external DNS provider?

## Related Decisions

- **ADR-002** (Future): Infrastructure-as-Code approach (Terraform vs CloudFormation)
- **ADR-003** (Future): Cognito migration strategy (if replacing Firebase Auth)
- **Task 34-45**: AWS migration implementation tasks in Taskmaster
- **Plan**: `docs/plans/02.aws-migration.md`

## References

- [AWS App Runner Docs](https://docs.aws.amazon.com/apprunner/)
- [RDS PostgreSQL with pgvector](https://aws.amazon.com/rds/postgresql/pgvector/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/BestPractices.html)
- Proposed Plan: `docs/plans/02.aws-migration.md`
