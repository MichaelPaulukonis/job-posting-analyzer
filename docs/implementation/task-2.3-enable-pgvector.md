# Task 2.3: Enable pgvector Extension - Implementation Guide

**Status**: 🔄 Ready to Execute (after RDS deployment)  
**Dependencies**: Task 2.1 (RDS deployed), Task 2.2 (Security configured)

## Overview

Enable PostgreSQL extensions required for the job-posting-analyzer application:
1. **uuid-ossp**: UUID generation for primary keys
2. **pgvector**: Vector similarity search for semantic job matching

## Implementation Approach

### Option 1: Automated Script (Recommended)

Run the provided script:
```bash
./scripts/enable-pgvector.sh
```

This script will:
1. Retrieve database endpoint from CloudFormation
2. Test database connectivity
3. Enable uuid-ossp extension
4. Enable pgvector extension
5. Verify installations
6. Test pgvector functionality

### Option 2: Using Aurora Postgres Power (MCP)

Use the amazon-aurora-postgresql power through Kiro:

```
# 1. Connect to database
Call: mcp_awslabspostgres_mcp_server_connect_to_database
Parameters:
  - region: "us-east-1"
  - database_type: "RPG"
  - connection_method: "pgwire"
  - cluster_identifier: "job-analyzer-postgres"
  - db_endpoint: "<from-cloudformation-output>"
  - port: 5432
  - database: "jobanalyzer"

# 2. Enable uuid-ossp
Call: mcp_awslabspostgres_mcp_server_run_query
Parameters:
  - connection_method: "pgwire"
  - cluster_identifier: "job-analyzer-postgres"
  - db_endpoint: "<endpoint>"
  - database: "jobanalyzer"
  - sql: "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# 3. Enable pgvector
Call: mcp_awslabspostgres_mcp_server_run_query
Parameters:
  - sql: "CREATE EXTENSION IF NOT EXISTS vector;"

# 4. Verify extensions
Call: mcp_awslabspostgres_mcp_server_run_query
Parameters:
  - sql: "SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');"
```

### Option 3: Manual psql

```bash
# Get endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name job-analyzer-rds \
  --query 'Stacks[0].Outputs[?OutputKey==`DBInstanceEndpoint`].OutputValue' \
  --output text)

# Connect
psql -h $DB_ENDPOINT -U dbadmin -d jobanalyzer

# Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

# Verify
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');
```

## Extension Details

### uuid-ossp Extension

**Purpose**: Generate UUIDs for primary keys and unique identifiers

**Functions Provided**:
- `uuid_generate_v1()`: Time-based UUID
- `uuid_generate_v4()`: Random UUID (recommended)
- `uuid_generate_v5()`: Namespace-based UUID

**Usage Example**:
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### pgvector Extension

**Purpose**: Store and query vector embeddings for semantic search

**Data Type**: `vector(n)` where n is the dimension

**Operators**:
- `<->`: L2 distance (Euclidean)
- `<#>`: Negative inner product
- `<=>`: Cosine distance

**Usage Example**:
```sql
CREATE TABLE job_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id),
  embedding vector(1536),  -- OpenAI ada-002 dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON job_embeddings USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

-- Find similar jobs
SELECT job_id, embedding <-> '[0.1, 0.2, ...]' AS distance
FROM job_embeddings
ORDER BY distance
LIMIT 10;
```

## Verification

### Check Extension Installation

```sql
-- List installed extensions
SELECT 
  extname AS "Extension",
  extversion AS "Version",
  extnamespace::regnamespace AS "Schema"
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector')
ORDER BY extname;
```

Expected output:
```
 Extension  | Version | Schema
------------+---------+--------
 uuid-ossp  | 1.1     | public
 vector     | 0.5.1   | public
```

### Test uuid-ossp

```sql
-- Generate UUIDs
SELECT uuid_generate_v4() AS uuid;

-- Create table with UUID primary key
CREATE TABLE test_uuid (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT
);

INSERT INTO test_uuid (name) VALUES ('test');
SELECT * FROM test_uuid;

DROP TABLE test_uuid;
```

### Test pgvector

```sql
-- Create test table
CREATE TABLE test_vectors (
  id SERIAL PRIMARY KEY,
  embedding vector(3)
);

-- Insert test vectors
INSERT INTO test_vectors (embedding) VALUES 
  ('[1,2,3]'),
  ('[4,5,6]'),
  ('[7,8,9]');

-- Test similarity search
SELECT 
  id,
  embedding,
  embedding <-> '[3,3,3]' AS l2_distance,
  embedding <#> '[3,3,3]' AS inner_product,
  embedding <=> '[3,3,3]' AS cosine_distance
FROM test_vectors
ORDER BY l2_distance
LIMIT 3;

-- Clean up
DROP TABLE test_vectors;
```

## Database Initialization Script

The `server/database/init.sql` file contains the extension setup:

```sql
-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extensions are installed
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector')
ORDER BY extname;
```

This script can be:
1. Run manually during setup
2. Executed by deployment scripts
3. Included in database migration tools

## Troubleshooting

### Extension Not Available

**Error**: `ERROR: could not open extension control file`

**Solution**: pgvector should be available in RDS PostgreSQL 15+. If not:
```sql
-- Check available extensions
SELECT * FROM pg_available_extensions WHERE name LIKE '%vector%';
```

### Permission Denied

**Error**: `ERROR: permission denied to create extension`

**Solution**: Ensure you're connected as a superuser (dbadmin):
```bash
psql -h $DB_ENDPOINT -U dbadmin -d jobanalyzer
```

### Connection Refused

**Error**: `could not connect to server`

**Solutions**:
1. Check security group allows your IP:
   ```bash
   ./scripts/configure-db-security.sh
   ```

2. Verify database is running:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier job-analyzer-postgres \
     --query 'DBInstances[0].DBInstanceStatus'
   ```

3. Test network connectivity:
   ```bash
   telnet $DB_ENDPOINT 5432
   ```

### Wrong Database

**Error**: Extensions created in wrong database

**Solution**: Always specify the correct database:
```bash
psql -h $DB_ENDPOINT -U dbadmin -d jobanalyzer  # Correct
# NOT: psql -h $DB_ENDPOINT -U dbadmin -d postgres
```

## Best Practices

### Extension Management

1. **Always use IF NOT EXISTS**: Prevents errors on re-runs
2. **Document extensions**: Keep init.sql updated
3. **Version control**: Track extension versions in migrations
4. **Test after enabling**: Verify functionality immediately

### pgvector Optimization

1. **Choose appropriate dimensions**: Match your embedding model
   - OpenAI ada-002: 1536 dimensions
   - OpenAI text-embedding-3-small: 1536 dimensions
   - OpenAI text-embedding-3-large: 3072 dimensions

2. **Create indexes**: Essential for performance
   ```sql
   -- IVFFlat index (faster build, good for most cases)
   CREATE INDEX ON embeddings USING ivfflat (embedding vector_l2_ops)
   WITH (lists = 100);
   
   -- HNSW index (slower build, better recall)
   CREATE INDEX ON embeddings USING hnsw (embedding vector_l2_ops);
   ```

3. **Choose right distance metric**:
   - L2 distance (`<->`): General purpose
   - Cosine distance (`<=>`): Normalized vectors
   - Inner product (`<#>`): When vectors are normalized

### UUID Best Practices

1. **Use v4 for random UUIDs**: Most common use case
2. **Set as DEFAULT**: Automatic generation
3. **Index UUID columns**: If used for lookups
4. **Consider ULID**: For sortable UUIDs (requires extension)

## Performance Considerations

### pgvector Index Tuning

```sql
-- Adjust lists parameter based on table size
-- Rule of thumb: lists = rows / 1000
-- Minimum: 10, Maximum: 1000

-- For 100K rows
CREATE INDEX ON embeddings USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

-- For 1M rows
CREATE INDEX ON embeddings USING ivfflat (embedding vector_l2_ops)
WITH (lists = 1000);
```

### Query Optimization

```sql
-- Use LIMIT for similarity searches
SELECT * FROM embeddings
ORDER BY embedding <-> '[...]'
LIMIT 10;  -- Always limit results

-- Use WHERE clauses to filter before similarity
SELECT * FROM embeddings
WHERE category = 'engineering'
ORDER BY embedding <-> '[...]'
LIMIT 10;
```

## Next Steps

After enabling extensions:
1. ✅ Extensions are ready for use
2. ➡️ Proceed to Task 2.4: Create Application Database Schema
3. ➡️ Design tables with UUID primary keys
4. ➡️ Create vector embedding tables
5. ➡️ Set up indexes for performance

## References

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [pgvector Documentation](https://github.com/pgvector/pgvector#readme)
- [PostgreSQL UUID Functions](https://www.postgresql.org/docs/current/uuid-ossp.html)
- [RDS PostgreSQL Extensions](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html#PostgreSQL.Concepts.General.Extensions)
- [Aurora Postgres Power](../../.kiro/powers/amazon-aurora-postgresql/)
- [Task 2: RDS PostgreSQL Setup](../../.taskmaster/tasks/task-2.md)
