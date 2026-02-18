#!/bin/bash
# Start RDS instance

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

echo -e "${GREEN}=== Start RDS Instance ===${NC}"
echo "[$(timestamp)] Starting process"
echo ""

# Check current status
STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE_ID \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text)

echo "[$(timestamp)] Current status: $STATUS"

if [ "$STATUS" = "available" ]; then
  echo -e "${GREEN}[$(timestamp)] Database is already running${NC}"
  
  # Show endpoint
  ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)
  
  echo "Endpoint: $ENDPOINT"
  exit 0
fi

if [ "$STATUS" != "stopped" ]; then
  echo -e "${YELLOW}[$(timestamp)] Database is in '$STATUS' state${NC}"
  echo "Waiting for it to reach 'stopped' or 'available' state..."
fi

if [ "$STATUS" = "stopped" ]; then
  echo -e "${YELLOW}[$(timestamp)] Starting RDS instance...${NC}"
  aws rds start-db-instance --db-instance-identifier $DB_INSTANCE_ID
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}[$(timestamp)] ✓ Start command sent successfully${NC}"
    echo ""
    echo -e "${YELLOW}Waiting for database to become available (typically 2-3 minutes)...${NC}"
  else
    echo -e "${RED}[$(timestamp)] ✗ Failed to start database${NC}"
    exit 1
  fi
fi

# Wait for available status
echo "[$(timestamp)] Waiting for 'available' status..."
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID

if [ $? -eq 0 ]; then
  echo -e "${GREEN}[$(timestamp)] ✓ Database is now available${NC}"
  echo ""
  
  # Show connection info
  ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)
  
  echo -e "${GREEN}=== Connection Information ===${NC}"
  echo "Endpoint: $ENDPOINT"
  echo "Port: 5432"
  echo "Database: jobanalyzer"
  echo "Username: dbadmin"
  echo ""
  echo "Connection string:"
  echo "postgresql://dbadmin:<password>@$ENDPOINT:5432/jobanalyzer"
  echo ""
  echo -e "${YELLOW}Cost while running: ~$12-15/month${NC}"
  echo "To stop when done, run: ./scripts/db/stop-rds.sh"
else
  echo -e "${RED}[$(timestamp)] ✗ Database failed to start${NC}"
  exit 1
fi
