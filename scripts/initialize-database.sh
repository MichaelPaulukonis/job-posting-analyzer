#!/bin/bash
# Initialize database schema and extensions
# Run this if deploy-database.sh couldn't connect initially

set -e

STACK_NAME="job-analyzer-rds"
REGION="${AWS_REGION:-us-east-1}"
DB_NAME="jobanalyzer"
DB_USER="dbadmin"

echo "🔧 Database Initialization"
echo "=========================="
echo ""

# Get database endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`DBInstanceEndpoint`].OutputValue' \
  --output text)

if [ -z "$DB_ENDPOINT" ]; then
  echo "❌ Could not find database endpoint"
  echo "   Make sure the RDS stack is deployed: ./scripts/deploy-database.sh"
  exit 1
fi

echo "📊 Database: $DB_ENDPOINT"
echo ""

# Get password
read -s -p "Enter database password: " DB_PASSWORD
echo ""
echo ""

export PGPASSWORD=$DB_PASSWORD

# Test connection
echo "🔍 Testing connection..."
if ! psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
  echo "❌ Could not connect to database"
  exit 1
fi
echo "✅ Connected"
echo ""

# Enable extensions
echo "🔧 Enabling extensions..."
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS vector;"
echo "✅ Extensions enabled"
echo ""

# Apply schema
echo "📊 Creating schema..."
if [ -f "server/database/schema.sql" ]; then
  psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -f server/database/schema.sql
  echo "✅ Schema created"
else
  echo "❌ Schema file not found: server/database/schema.sql"
  exit 1
fi
echo ""

# Verify
echo "📋 Verification:"
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "
SELECT 
  'Tables' as type,
  COUNT(*)::text as count
FROM pg_tables 
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Extensions' as type,
  COUNT(*)::text as count
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector');
"

unset PGPASSWORD

echo ""
echo "✅ Database initialization complete!"
