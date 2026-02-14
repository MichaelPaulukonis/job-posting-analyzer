#!/bin/bash
# Enable pgvector and required extensions on RDS PostgreSQL

set -e

STACK_NAME="job-analyzer-rds"
REGION="${AWS_REGION:-us-east-1}"
DB_NAME="jobanalyzer"
DB_USER="dbadmin"

echo "🔌 Enabling PostgreSQL Extensions..."
echo ""

# Get database endpoint from stack
echo "📋 Retrieving database endpoint from CloudFormation..."
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`DBInstanceEndpoint`].OutputValue' \
  --output text)

if [ -z "$DB_ENDPOINT" ]; then
  echo "❌ Could not find database endpoint from stack outputs"
  echo "   Make sure the RDS stack is deployed: ./scripts/deploy-rds.sh"
  exit 1
fi

echo "✅ Database Endpoint: $DB_ENDPOINT"
echo ""

# Prompt for password
read -s -p "Enter database password for user '$DB_USER': " DB_PASSWORD
echo ""
echo ""

# Test connection
echo "🔍 Testing database connection..."
export PGPASSWORD=$DB_PASSWORD

if ! psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
  echo "❌ Could not connect to database"
  echo "   Check:"
  echo "   1. Database is running and accessible"
  echo "   2. Security group allows your IP (run ./scripts/configure-db-security.sh)"
  echo "   3. Password is correct"
  exit 1
fi

echo "✅ Connection successful!"
echo ""

# Enable extensions
echo "🔧 Enabling extensions..."
echo ""

echo "1. Enabling uuid-ossp extension..."
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
echo "✅ uuid-ossp enabled"
echo ""

echo "2. Enabling pgvector extension..."
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS vector;"
echo "✅ pgvector enabled"
echo ""

# Verify extensions
echo "📊 Verifying installed extensions..."
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "
SELECT 
  extname AS \"Extension\",
  extversion AS \"Version\",
  CASE 
    WHEN extname = 'uuid-ossp' THEN 'UUID generation'
    WHEN extname = 'vector' THEN 'Semantic search with embeddings'
    ELSE 'Other'
  END AS \"Purpose\"
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector')
ORDER BY extname;
"

echo ""
echo "✅ All extensions enabled successfully!"
echo ""

# Test pgvector functionality
echo "🧪 Testing pgvector functionality..."
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME << 'EOF'
-- Create test table with vector column
CREATE TABLE IF NOT EXISTS vector_test (
  id SERIAL PRIMARY KEY,
  embedding vector(3)
);

-- Insert test data
INSERT INTO vector_test (embedding) VALUES ('[1,2,3]'), ('[4,5,6]');

-- Test vector operations
SELECT 
  id,
  embedding,
  embedding <-> '[3,3,3]' AS distance
FROM vector_test
ORDER BY distance
LIMIT 2;

-- Clean up test table
DROP TABLE vector_test;
EOF

echo ""
echo "✅ pgvector is working correctly!"
echo ""
echo "🎯 Next steps:"
echo "   1. Create application database schema (Task 2.4)"
echo "   2. Set up connection pooling (Task 2.5)"
echo ""
echo "📝 Connection details:"
echo "   Host: $DB_ENDPOINT"
echo "   Port: 5432"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Clear password from environment
unset PGPASSWORD
