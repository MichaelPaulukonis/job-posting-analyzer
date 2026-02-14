#!/bin/bash
# Initialize Prisma database schema
# Run this if deploy-database.sh couldn't complete the Prisma setup

set -e

echo "🔧 Prisma Database Initialization"
echo "=================================="
echo ""

# Check if .env exists and has DATABASE_URL
if [ ! -f ".env" ]; then
  echo "❌ .env file not found"
  echo "   Please create .env file with DATABASE_URL"
  echo "   Format: DATABASE_URL=\"postgresql://user:password@host:5432/database?schema=public\""
  exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "^DATABASE_URL=" .env; then
  echo "❌ DATABASE_URL not found in .env file"
  echo "   Please add DATABASE_URL to .env file"
  echo "   Format: DATABASE_URL=\"postgresql://user:password@host:5432/database?schema=public\""
  exit 1
fi

echo "✅ Found DATABASE_URL in .env"
echo ""

# Load environment variables
export $(grep -v '^#' .env | xargs)

echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

echo "📊 Pushing schema to database..."
npx prisma db push --accept-data-loss
echo "✅ Database schema created"
echo ""

echo "📋 Verifying setup..."
npx prisma db execute --stdin <<EOF
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
EOF

echo ""
echo "✅ Prisma database initialization complete!"
echo ""
echo "🎯 Next Steps:"
echo "   1. Use 'npx prisma studio' to view your database"
echo "   2. Import Prisma Client: import { prisma } from '~/server/utils/prisma'"
echo "   3. Start building your API endpoints"
echo ""
