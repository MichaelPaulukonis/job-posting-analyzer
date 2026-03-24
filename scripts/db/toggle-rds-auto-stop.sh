#!/bin/bash
# Toggle the SSM parameter that controls automated RDS stop behavior.
#
# When db-keep-running = true:  the scheduled Lambda will skip stopping the DB.
# When db-keep-running = false: the scheduled Lambda will stop the DB on its next run.
#
# Usage:
#   ./scripts/db/toggle-rds-auto-stop.sh --keep-running   # DB stays up
#   ./scripts/db/toggle-rds-auto-stop.sh --allow-stop     # Lambda may stop DB
#   ./scripts/db/toggle-rds-auto-stop.sh --status         # Show current value
#   ./scripts/db/toggle-rds-auto-stop.sh --help

set -e

PARAMETER_NAME="${SSM_PARAMETER_NAME:-/jobanalyzer/db-keep-running}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

usage() {
  echo ""
  echo "Usage: $(basename "$0") [OPTION]"
  echo ""
  echo "Manage the SSM parameter that controls automated RDS instance stopping."
  echo "Parameter: ${PARAMETER_NAME}"
  echo ""
  echo "Options:"
  echo "  --keep-running   Set to 'true'  — Lambda will NOT stop the DB on its next run"
  echo "  --allow-stop     Set to 'false' — Lambda WILL stop the DB on its next run"
  echo "  --status         Show the current parameter value (no changes made)"
  echo "  --help           Show this help message"
  echo ""
  echo "Examples:"
  echo "  # Before starting work — prevent auto-stop:"
  echo "  ./scripts/db/toggle-rds-auto-stop.sh --keep-running"
  echo ""
  echo "  # When done for the day — allow Lambda to stop DB:"
  echo "  ./scripts/db/toggle-rds-auto-stop.sh --allow-stop"
  echo ""
  echo "  # Check current setting:"
  echo "  ./scripts/db/toggle-rds-auto-stop.sh --status"
  echo ""
}

get_current_value() {
  aws ssm get-parameter \
    --name "$PARAMETER_NAME" \
    --query 'Parameter.Value' \
    --output text 2>/dev/null || echo "NOT_FOUND"
}

show_status() {
  echo -e "${CYAN}=== RDS Auto-Stop Status ===${NC}"
  CURRENT=$(get_current_value)

  if [ "$CURRENT" = "NOT_FOUND" ]; then
    echo -e "${RED}Parameter not found: ${PARAMETER_NAME}${NC}"
    echo "Has the CloudFormation stack been deployed?"
    echo "  aws cloudformation deploy --template-file infra/cloudformation/rds-auto-stop.yml \\"
    echo "    --stack-name job-analyzer-rds-auto-stop --capabilities CAPABILITY_NAMED_IAM"
    exit 1
  fi

  echo "Parameter: ${PARAMETER_NAME}"
  echo -n "Value:     "
  if [ "$CURRENT" = "true" ]; then
    echo -e "${GREEN}true${NC} — Lambda will SKIP stopping the DB"
  else
    echo -e "${YELLOW}false${NC} — Lambda WILL stop the DB on its next run"
  fi
}

set_value() {
  local new_value="$1"
  local description="$2"

  echo -e "${CYAN}=== Updating RDS Auto-Stop Parameter ===${NC}"
  echo "Parameter: ${PARAMETER_NAME}"
  echo "New value: ${new_value}"
  echo ""

  # Confirm before changing
  read -r -p "Proceed? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi

  aws ssm put-parameter \
    --name "$PARAMETER_NAME" \
    --value "$new_value" \
    --type String \
    --overwrite

  if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Parameter updated successfully${NC}"
    echo ""
    echo -e "$description"
  else
    echo -e "${RED}✗ Failed to update parameter${NC}"
    exit 1
  fi
}

# Parse arguments
case "${1:-}" in
  --keep-running)
    set_value "true" "${GREEN}The scheduled Lambda will NOT stop the RDS instance on its next run.${NC}
Remember to run --allow-stop when you're done working."
    ;;
  --allow-stop)
    set_value "false" "${YELLOW}The scheduled Lambda WILL stop the RDS instance on its next run.${NC}
To start the DB when needed: ./scripts/db/start-rds.sh"
    ;;
  --status)
    show_status
    ;;
  --help|-h)
    usage
    ;;
  "")
    echo -e "${RED}Error: No option provided.${NC}"
    usage
    exit 1
    ;;
  *)
    echo -e "${RED}Error: Unknown option '${1}'.${NC}"
    usage
    exit 1
    ;;
esac
