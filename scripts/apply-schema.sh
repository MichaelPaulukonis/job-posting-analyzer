#!/bin/bash
# Apply database schema to RDS PostgreSQL

set -e

STACK_NAME="job-analyzer-rds"
REGION="${AWS_REGION:-us-east-1}"
DB_NAME="jobanalyzer"
DB_USER="dbadmin"
SCHEMA_FILE="server/database/schema.sql"

echo "📊 Applying Database Schema..."
echo ""

# Get database endpoint
echo "📋 Retrieving database endpoint..."
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`DBInstanceEndpoint`].OutputValue' \
  --output text)

if [ -z "$DB_ENDPOINT" ]; then
  echo "❌ Could not find database endpoint"
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
  exit 1
fi

echo "✅ Connection successful!"
echo ""

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
  echo "❌ Schema file not found: $SCHEMA_FILE"
  exit 1
fi

# Apply schema
echo "🔧 Applying schema from $SCHEMA_FILE..."
echo ""

psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -f $SCHEMA_FILE

echo ""
echo "✅ Schema applied successfully!"
echo ""

# Verify tables
echo "📊 Verifying created tables..."
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
"

echo ""
echo "📊 Verifying indexes..."
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"

echo ""
echo "📊 Verifying views..."
psql -h $DB_ENDPOINT -U $DB_USER -d $DB_NAME -c "
SELECT 
  schemaname,
  viewname
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;
"

echo ""
echo "✅ Database schema setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Test database operations"
echo "   2. Set up connection pooling (Task 2.5)"
echo "   3. Migrate existing JSON data to database"

# Clear password
unset PGPASSWORD
