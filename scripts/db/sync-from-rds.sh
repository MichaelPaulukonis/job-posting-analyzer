#!/bin/bash

# Sync data FROM RDS TO local dev database
# This pulls production data into your local environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Syncing Data from RDS to Local ===${NC}"
echo ""

# RDS connection details
RDS_HOST="job-analyzer-postgres.cyjek0mosjy6.us-east-1.rds.amazonaws.com"
RDS_USER="dbadmin"
RDS_PASSWORD="Mongoworlion123"
RDS_DB="jobanalyzer"

# Local connection details
LOCAL_HOST="localhost"
LOCAL_PORT="5434"
LOCAL_USER="dbadmin"
LOCAL_PASSWORD="localdevpass"
LOCAL_DB="jobanalyzer"

# Backup directory
BACKUP_DIR="$PROJECT_ROOT/.data/db-backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="$BACKUP_DIR/rds-dump-$TIMESTAMP.sql"

echo "Step 1: Checking RDS status..."
RDS_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier job-analyzer-postgres \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text 2>/dev/null || echo "error")

if [ "$RDS_STATUS" != "available" ]; then
  echo -e "${RED}Error: RDS is not available (status: $RDS_STATUS)${NC}"
  echo "Please start RDS first: ./scripts/db/start-rds.sh"
  exit 1
fi

echo -e "${GREEN}✓ RDS is available${NC}"
echo ""

echo "Step 2: Checking local database..."
if ! docker ps | grep -q job-analyzer-dev-db; then
  echo -e "${RED}Error: Local dev database is not running${NC}"
  echo "Please start it first: docker-compose -f docker-compose.local.yml up -d"
  exit 1
fi

echo -e "${GREEN}✓ Local database is running${NC}"
echo ""

echo "Step 3: Dumping data from RDS..."
echo "This may take a minute..."
PGPASSWORD="$RDS_PASSWORD" pg_dump \
  -h "$RDS_HOST" \
  -U "$RDS_USER" \
  -d "$RDS_DB" \
  --no-owner \
  --no-acl \
  -f "$DUMP_FILE"

echo -e "${GREEN}✓ Data dumped to: $DUMP_FILE${NC}"
echo ""

echo "Step 4: Restoring to local database..."
echo "This will REPLACE all local data!"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

# Drop and recreate database
docker exec -i job-analyzer-dev-db psql -U "$LOCAL_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS $LOCAL_DB;
CREATE DATABASE $LOCAL_DB;
EOF

# Restore dump
PGPASSWORD="$LOCAL_PASSWORD" psql \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -f "$DUMP_FILE" \
  > /dev/null 2>&1

echo -e "${GREEN}✓ Data restored to local database${NC}"
echo ""

echo "Step 5: Generating Prisma client..."
cd "$PROJECT_ROOT"
npx prisma generate

echo ""
echo -e "${GREEN}=== Sync Complete ===${NC}"
echo ""
echo "Summary:"
echo "  • RDS data dumped to: $DUMP_FILE"
echo "  • Local database updated with RDS data"
echo "  • Schema and data restored from RDS"
echo ""
echo "Your local dev database now matches RDS!"
