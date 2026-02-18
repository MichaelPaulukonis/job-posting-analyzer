#!/bin/bash

# Sync data FROM local TO RDS
# This pushes your local development data to production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Syncing Data from Local to RDS ===${NC}"
echo ""
echo -e "${RED}WARNING: This will REPLACE all RDS data with local data!${NC}"
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
DUMP_FILE="$BACKUP_DIR/local-dump-$TIMESTAMP.sql"
RDS_BACKUP_FILE="$BACKUP_DIR/rds-backup-before-sync-$TIMESTAMP.sql"

echo "Step 1: Checking local database..."
if ! docker ps | grep -q job-analyzer-dev-db; then
  echo -e "${RED}Error: Local dev database is not running${NC}"
  echo "Please start it first: docker-compose -f docker-compose.local.yml up -d"
  exit 1
fi

echo -e "${GREEN}✓ Local database is running${NC}"
echo ""

echo "Step 2: Checking RDS status..."
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

echo "Step 3: Backing up current RDS data (safety)..."
PGPASSWORD="$RDS_PASSWORD" pg_dump \
  -h "$RDS_HOST" \
  -U "$RDS_USER" \
  -d "$RDS_DB" \
  --no-owner \
  --no-acl \
  -f "$RDS_BACKUP_FILE"

echo -e "${GREEN}✓ RDS backup saved to: $RDS_BACKUP_FILE${NC}"
echo ""

echo "Step 4: Dumping local data..."
PGPASSWORD="$LOCAL_PASSWORD" pg_dump \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  --no-owner \
  --no-acl \
  -f "$DUMP_FILE"

echo -e "${GREEN}✓ Local data dumped to: $DUMP_FILE${NC}"
echo ""

echo "Step 5: Restoring to RDS..."
echo -e "${RED}This will REPLACE all RDS data!${NC}"
read -p "Are you absolutely sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

# Drop and recreate database on RDS
PGPASSWORD="$RDS_PASSWORD" psql \
  -h "$RDS_HOST" \
  -U "$RDS_USER" \
  -d postgres <<EOF
DROP DATABASE IF EXISTS $RDS_DB;
CREATE DATABASE $RDS_DB;
EOF

# Restore dump to RDS
PGPASSWORD="$RDS_PASSWORD" psql \
  -h "$RDS_HOST" \
  -U "$RDS_USER" \
  -d "$RDS_DB" \
  -f "$DUMP_FILE" \
  > /dev/null 2>&1

echo -e "${GREEN}✓ Data restored to RDS${NC}"
echo ""

echo -e "${GREEN}=== Sync Complete ===${NC}"
echo ""
echo "Summary:"
echo "  • RDS backup saved to: $RDS_BACKUP_FILE"
echo "  • Local data dumped to: $DUMP_FILE"
echo "  • RDS updated with local data"
echo ""
echo "RDS now matches your local dev database!"
