# Task 2.4: Database Schema - Implementation Guide

**Status**: ✅ Complete  
**Dependencies**: Task 2.3 (Extensions enabled)

## Overview

Created a comprehensive PostgreSQL schema for the job-posting-analyzer application with improvements over the existing JSON file storage approach.

## Schema Improvements Over JSON Storage

### Current Approach (JSON Files)
The application currently stores data in flat JSON files:
- `.data/resumes.json` - Resume storage
- `.data/analysis-history.json` - Analysis results
- `.data/conversations.json` - Chat history
- `.data/cover-letter-samples.json` - Cover letters

### Problems with Current Approach
1. **No Relationships**: Can't enforce referential integrity
2. **No Indexing**: Slow searches as data grows
3. **No Vector Search**: Can't do semantic similarity matching
4. **Concurrent Access**: Risk of data corruption with multiple users
5. **No Versioning**: Can't track changes over time
6. **Limited Querying**: Can't do complex queries or aggregations
7. **Scalability**: Performance degrades with data growth

### New Database Schema Benefits

#### 1. Proper Relationships
- Foreign keys ensure data integrity
- Cascade deletes prevent orphaned records
- Clear data model with normalized structure

#### 2. Semantic Search with pgvector
- Store embeddings for resumes and job postings
- Find similar jobs/resumes using vector similarity
- Support for chunking long documents
- Efficient similarity search with IVFFlat indexes

#### 3. Performance Optimization
- Indexes on frequently queried columns
- Vector indexes for fast similarity search
- Views for common query patterns
- Automatic timestamp management

#### 4. Data Versioning
- Track creation and update timestamps
- Version field for cover letters
- Audit trail for analysis results

#### 5. Flexible Metadata
- JSONB columns for extensibility
- Store AI model parameters
- Track prompt versions
- Custom fields without schema changes

#### 6. Multi-User Support
- User table for future expansion
- User-scoped data access
- Prepared for authentication integration

## Schema Design

### Core Tables

#### users
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- name (VARCHAR)
- created_at, updated_at (TIMESTAMPTZ)
```
Future-proofing for multi-user support.

#### resumes
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- name (VARCHAR)
- content (TEXT)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```
Stores resume text with flexible metadata.

#### resume_embeddings
```sql
- id (UUID, PK)
- resume_id (UUID, FK)
- embedding (vector(1536))
- chunk_text (TEXT)
- chunk_index (INTEGER)
- created_at (TIMESTAMPTZ)
```
**NEW**: Enables semantic search across resumes.
Supports chunking for long documents.

#### job_postings
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- title (VARCHAR)
- company (VARCHAR)
- content (TEXT)
- url (TEXT)
- location (VARCHAR)
- salary_range (VARCHAR)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```
Structured job posting storage with searchable fields.

#### job_posting_embeddings
```sql
- id (UUID, PK)
- job_posting_id (UUID, FK)
- embedding (vector(1536))
- chunk_text (TEXT)
- chunk_index (INTEGER)
- created_at (TIMESTAMPTZ)
```
**NEW**: Enables semantic job search and matching.

#### analysis_results
```sql
- id (UUID, PK)
- resume_id (UUID, FK)
- job_posting_id (UUID, FK)
- matches (TEXT[])
- gaps (TEXT[])
- suggestions (TEXT[])
- similarity_score (DECIMAL)
- analysis_metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```
**IMPROVED**: Added similarity_score and metadata tracking.

#### cover_letters
```sql
- id (UUID, PK)
- analysis_result_id (UUID, FK)
- resume_id (UUID, FK)
- job_posting_id (UUID, FK)
- content (TEXT)
- version (INTEGER)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```
**NEW**: Separate table with versioning support.

#### conversations
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- resume_id (UUID, FK)
- job_posting_id (UUID, FK)
- messages (JSONB)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```
Chat history with context linking.

### Indexes

#### Performance Indexes
- User email lookup
- Resume/job posting by user
- Time-based queries (created_at DESC)
- Title/company searches

#### Vector Indexes
```sql
CREATE INDEX ON resume_embeddings 
  USING ivfflat (embedding vector_l2_ops) 
  WITH (lists = 100);

CREATE INDEX ON job_posting_embeddings 
  USING ivfflat (embedding vector_l2_ops) 
  WITH (lists = 100);
```
IVFFlat indexes for fast approximate nearest neighbor search.

### Triggers

Automatic `updated_at` timestamp management:
```sql
CREATE TRIGGER update_<table>_updated_at 
  BEFORE UPDATE ON <table>
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Views

#### latest_analysis
Shows most recent analysis for each resume-job combination.

#### resume_stats
Aggregates analysis statistics per resume.

## Deployment

### Apply Schema
```bash
./scripts/apply-schema.sh
```

### Manual Application
```bash
psql -h $DB_ENDPOINT -U dbadmin -d jobanalyzer -f server/database/schema.sql
```

## Usage Examples

### Store Resume with Embedding
```sql
-- Insert resume
INSERT INTO resumes (user_id, name, content, metadata)
VALUES (
  '<user_id>',
  'Senior Engineer Resume',
  '<resume_text>',
  '{"version": "2024-01", "source": "upload"}'::jsonb
)
RETURNING id;

-- Insert embedding
INSERT INTO resume_embeddings (resume_id, embedding, chunk_text, chunk_index)
VALUES (
  '<resume_id>',
  '[0.1, 0.2, ...]',  -- 1536-dimensional vector
  '<text_chunk>',
  0
);
```

### Find Similar Jobs
```sql
SELECT 
  jp.id,
  jp.title,
  jp.company,
  jpe.embedding <-> (
    SELECT embedding 
    FROM resume_embeddings 
    WHERE resume_id = '<resume_id>' 
    LIMIT 1
  ) AS distance
FROM job_postings jp
JOIN job_posting_embeddings jpe ON jp.id = jpe.job_posting_id
ORDER BY distance
LIMIT 10;
```

### Store Analysis Result
```sql
INSERT INTO analysis_results (
  resume_id,
  job_posting_id,
  matches,
  gaps,
  suggestions,
  similarity_score,
  analysis_metadata
)
VALUES (
  '<resume_id>',
  '<job_posting_id>',
  ARRAY['Node.js', 'TypeScript', 'AWS'],
  ARRAY['GCP', 'Kubernetes'],
  ARRAY['Add GCP experience', 'Highlight cloud skills'],
  0.8542,
  '{"model": "gpt-4", "prompt_version": "v2.1"}'::jsonb
);
```

### Get Analysis History
```sql
SELECT 
  ar.id,
  jp.title,
  jp.company,
  ar.similarity_score,
  ar.matches,
  ar.gaps,
  ar.created_at
FROM analysis_results ar
JOIN job_postings jp ON ar.job_posting_id = jp.id
WHERE ar.resume_id = '<resume_id>'
ORDER BY ar.created_at DESC;
```

## Migration from JSON Files

### Migration Strategy

1. **Create Migration Script**: Parse JSON files and insert into database
2. **Generate Embeddings**: Create embeddings for existing resumes/jobs
3. **Preserve IDs**: Use existing IDs where possible
4. **Validate Data**: Ensure all relationships are correct
5. **Backup First**: Keep JSON files as backup during transition

### Sample Migration Code
```javascript
// Pseudo-code for migration
const resumes = JSON.parse(fs.readFileSync('.data/resumes.json'));

for (const resume of resumes) {
  // Insert resume
  const result = await db.query(`
    INSERT INTO resumes (id, name, content, created_at)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [resume.id, resume.name, resume.content, resume.timestamp]);
  
  // Generate and insert embedding
  const embedding = await generateEmbedding(resume.content);
  await db.query(`
    INSERT INTO resume_embeddings (resume_id, embedding)
    VALUES ($1, $2)
  `, [result.rows[0].id, embedding]);
}
```

## Performance Considerations

### Vector Index Tuning
```sql
-- Adjust lists parameter based on table size
-- Rule of thumb: lists = rows / 1000
-- For 100K embeddings:
CREATE INDEX ON resume_embeddings 
  USING ivfflat (embedding vector_l2_ops) 
  WITH (lists = 100);
```

### Query Optimization
- Always use LIMIT on similarity searches
- Add WHERE clauses before similarity operations
- Use prepared statements for repeated queries
- Monitor query performance with EXPLAIN ANALYZE

### Maintenance
```sql
-- Update statistics
ANALYZE resume_embeddings;
ANALYZE job_posting_embeddings;

-- Vacuum tables periodically
VACUUM ANALYZE resumes;
VACUUM ANALYZE job_postings;
```

## Next Steps

1. ✅ Schema created and documented
2. ➡️ Set up connection pooling (Task 2.5)
3. ➡️ Create migration script for JSON data
4. ➡️ Update application code to use database
5. ➡️ Implement embedding generation pipeline

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [UUID Best Practices](https://www.postgresql.org/docs/current/uuid-ossp.html)
- [JSONB Performance](https://www.postgresql.org/docs/current/datatype-json.html)
- [Task 2: RDS PostgreSQL Setup](../../.taskmaster/tasks/task-2.md)
