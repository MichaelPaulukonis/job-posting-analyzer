#!/bin/bash
# Deploy Aurora Serverless v1 cluster

set -e

STACK_NAME="job-analyzer-aurora-serverless"
TEMPLATE_FILE="infra/cloudformation/aurora-serverless-v1.yml"
ENVIRONMENT_NAME="job-analyzer"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Aurora Serverless v1 Deployment ===${NC}"
echo ""

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
  echo -e "${YELLOW}DB_PASSWORD environment variable not set.${NC}"
  echo -n "Enter database password (min 8 alphanumeric characters): "
  read -s DB_PASSWORD
  echo ""
  
  if [ ${#DB_PASSWORD} -lt 8 ]; then
    echo -e "${RED}Error: Password must be at least 8 characters${NC}"
    exit 1
  fi
fi

# Validate template
echo -e "${YELLOW}Validating CloudFormation template...${NC}"
aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE \
  > /dev/null

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Template validation successful${NC}"
else
  echo -e "${RED}✗ Template validation failed${NC}"
  exit 1
fi

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  2>&1 | grep -c "does not exist" || true)

if [ $STACK_EXISTS -eq 0 ]; then
  echo -e "${YELLOW}Stack already exists. Updating...${NC}"
  OPERATION="update-stack"
  WAIT_CONDITION="stack-update-complete"
else
  echo -e "${YELLOW}Creating new stack...${NC}"
  OPERATION="create-stack"
  WAIT_CONDITION="stack-create-complete"
fi

# Deploy stack
echo -e "${YELLOW}Deploying Aurora Serverless v1 cluster...${NC}"
echo "  Environment: $ENVIRONMENT_NAME"
echo "  Min Capacity: 2 ACU (4GB RAM)"
echo "  Max Capacity: 4 ACU (8GB RAM)"
echo "  Auto-pause: 5 minutes"
echo ""

aws cloudformation $OPERATION \
  --stack-name $STACK_NAME \
  --template-body file://$TEMPLATE_FILE \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=$ENVIRONMENT_NAME \
    ParameterKey=DBName,ParameterValue=jobanalyzer \
    ParameterKey=DBUsername,ParameterValue=dbadmin \
    ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
    ParameterKey=MinCapacity,ParameterValue=2 \
    ParameterKey=MaxCapacity,ParameterValue=4 \
    ParameterKey=AutoPauseSeconds,ParameterValue=300 \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags \
    Key=Environment,Value=$ENVIRONMENT_NAME \
    Key=Project,Value=job-posting-analyzer \
    Key=ManagedBy,Value=CloudFormation

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Stack deployment failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Stack deployment initiated${NC}"
echo ""
echo -e "${YELLOW}Waiting for stack to complete (this may take 5-10 minutes)...${NC}"
echo "You can monitor progress in the AWS Console:"
echo "https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks"
echo ""

# Wait for stack completion
aws cloudformation wait $WAIT_CONDITION \
  --stack-name $STACK_NAME

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Stack deployment complete!${NC}"
  echo ""
  
  # Get outputs
  echo -e "${GREEN}=== Aurora Cluster Information ===${NC}"
  aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table
  
  echo ""
  echo -e "${GREEN}=== Next Steps ===${NC}"
  echo "1. Install pgvector extension:"
  echo "   psql -h <endpoint> -U dbadmin -d jobanalyzer -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
  echo ""
  echo "2. Run Prisma migrations:"
  echo "   npx prisma db push"
  echo ""
  echo "3. Update .env with new connection string:"
  echo "   DATABASE_URL=\"postgresql://dbadmin:<password>@<endpoint>:5432/jobanalyzer\""
  echo ""
  echo -e "${YELLOW}Note: Cluster will auto-pause after 5 minutes of inactivity${NC}"
  echo -e "${YELLOW}First connection after pause will take ~30 seconds${NC}"
  
else
  echo -e "${RED}✗ Stack deployment failed${NC}"
  echo "Check CloudFormation console for details"
  exit 1
fi
