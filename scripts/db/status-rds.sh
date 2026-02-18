#!/bin/bash
# Check RDS instance status

set -e

DB_INSTANCE_ID="job-analyzer-postgres"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== RDS Instance Status ===${NC}"
echo ""

# Get instance details
aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE_ID \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address,Engine:Engine,EngineVersion:EngineVersion,InstanceClass:DBInstanceClass,Storage:AllocatedStorage,MultiAZ:MultiAZ}' \
  --output table

echo ""

# Get status
STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE_ID \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text)

# Show status-specific info
case $STATUS in
  "available")
    echo -e "${GREEN}✓ Database is running${NC}"
    echo -e "${YELLOW}Cost: ~$12-15/month${NC}"
    echo ""
    echo "To stop and save costs, run: ./scripts/db/stop-rds.sh"
    ;;
  "stopped")
    echo -e "${BLUE}○ Database is stopped${NC}"
    echo -e "${GREEN}Cost: ~$2.30/month (storage only)${NC}"
    echo ""
    echo -e "${YELLOW}Note: Will auto-restart after 7 days${NC}"
    echo "To start, run: ./scripts/db/start-rds.sh"
    ;;
  "stopping")
    echo -e "${YELLOW}⏳ Database is stopping...${NC}"
    ;;
  "starting")
    echo -e "${YELLOW}⏳ Database is starting...${NC}"
    ;;
  *)
    echo -e "${YELLOW}Status: $STATUS${NC}"
    ;;
esac
