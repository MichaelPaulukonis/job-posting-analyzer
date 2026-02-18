#!/bin/bash

# Initial setup for local development database
# Run this once to get started with local development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Setting Up Local Development Database ===${NC}"
echo ""

echo "Step 1: Starting local PostgreSQL with pgvector..."
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.local.yml up -d

echo "Waiting for database to be ready..."
sleep 5

# Wait for health check
for i in {1..30}; do
  if docker exec job-analyzer-dev-db pg_isready -U dbadmin -d jobanalyzer > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}Error: Database failed to start${NC}"
    exit 1
  fi
  sleep 1
done

echo ""
echo "Step 2: Running Prisma migrations..."
# Use .env.local for this operation
export $(cat .env.local | grep -v '^#' | xargs)
npx prisma migrate deploy

echo ""
echo "Step 3: Generating Prisma client..."
npx prisma generate

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Your local development database is ready!"
echo ""
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5434"
echo "  Database: jobanalyzer"
echo "  User: dbadmin"
echo "  Password: localdevpass"
echo ""
echo "To use it for development:"
echo "  1. Copy .env.local to .env (or use it directly)"
echo "  2. Run: npm run dev"
echo ""
echo "Useful commands:"
echo "  • Start database: docker-compose -f docker-compose.local.yml up -d"
echo "  • Stop database: docker-compose -f docker-compose.local.yml down"
echo "  • View logs: docker-compose -f docker-compose.local.yml logs -f"
echo "  • Sync from RDS: ./scripts/db/sync-from-rds.sh"
echo "  • Sync to RDS: ./scripts/db/sync-to-rds.sh"
echo ""
echo "Database data is persisted in Docker volume: postgres-dev-data"
