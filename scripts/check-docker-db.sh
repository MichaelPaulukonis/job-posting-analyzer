#!/bin/bash

# Script to check the Docker database and connect Prisma Studio
# This helps verify if cover_letters table is actually empty

echo "🔍 Checking Docker Database..."
echo ""

# Database connection details
DB_HOST="localhost"
DB_PORT="5434"
DB_NAME="jobanalyzer"
DB_USER="dbadmin"
DB_PASSWORD="localdevpass"

# Check if database is accessible
echo "1. Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database is accessible"
else
    echo "❌ Cannot connect to database. Is Docker running?"
    exit 1
fi

echo ""
echo "2. Checking cover_letters table..."
COVER_LETTER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM cover_letters;")
echo "   Cover letters in database: $COVER_LETTER_COUNT"

echo ""
echo "3. Checking conversations table..."
CONVERSATION_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM conversations;")
echo "   Conversations in database: $CONVERSATION_COUNT"

echo ""
echo "4. Sample cover letter data (if any)..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, LEFT(content, 50) as content_preview, created_at FROM cover_letters LIMIT 5;"

echo ""
echo "5. To open Prisma Studio connected to Docker database:"
echo "   DATABASE_URL='postgresql://dbadmin:localdevpass@localhost:5434/jobanalyzer?schema=public' npx prisma studio"
echo ""
echo "6. To run Prisma Studio now, press Enter (or Ctrl+C to cancel)"
read

DATABASE_URL='postgresql://dbadmin:localdevpass@localhost:5434/jobanalyzer?schema=public' npx prisma studio
