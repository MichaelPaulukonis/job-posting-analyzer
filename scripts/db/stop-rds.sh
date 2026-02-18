#!/bin/bash
# Stop RDS instance to save costs

set -e

DB_INSTANCE_ID="job-analyzer-postgres"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Timestamp function
timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

echo -e "${GREEN}=== Stop RDS Instance ===${NC}"
echo "[$(timestamp)] Starting process"
echo ""

# Check current status
STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE_ID \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text)

echo "[$(timestamp)] Current status: $STATUS"

if [ "$STATUS" = "stopped" ]; then
  echo -e "${YELLOW}[$(timestamp)] Database is already stopped${NC}"
  exit 0
fi

if [ "$STATUS" != "available" ]; then
  echo -e "${RED}[$(timestamp)] Database is not in 'available' state. Current state: $STATUS${NC}"
  echo "Cannot stop database in this state."
  exit 1
fi

echo -e "${YELLOW}[$(timestamp)] Stopping RDS instance...${NC}"
aws rds stop-db-instance --db-instance-identifier $DB_INSTANCE_ID

if [ $? -eq 0 ]; then
  echo -e "${GREEN}[$(timestamp)] ✓ Stop command sent successfully${NC}"
  echo ""
  echo -e "${YELLOW}Note: Database will take 5-10 minutes to fully stop${NC}"
  echo -e "${YELLOW}Note: Database will auto-restart after 7 days${NC}"
  echo -e "${YELLOW}Cost while stopped: ~$2.30/month (storage only)${NC}"
  echo ""
  echo "To check status, run: ./scripts/db/status-rds.sh"
  echo "To start again, run: ./scripts/db/start-rds.sh"
else
  echo -e "${RED}[$(timestamp)] ✗ Failed to stop database${NC}"
  exit 1
fi
