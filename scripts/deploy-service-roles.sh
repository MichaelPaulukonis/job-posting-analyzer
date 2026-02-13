#!/bin/bash

# Service Roles CloudFormation Stack Deployment Script
# Deploys IAM roles for AWS services to communicate securely

set -e  # Exit on error

STACK_NAME="job-analyzer-service-roles"
TEMPLATE_FILE="infra/cloudformation/service-roles.yml"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-job-analyzer}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Deploying Service Roles CloudFormation Stack"
echo "================================================"
echo "Stack Name: $STACK_NAME"
echo "Template: $TEMPLATE_FILE"
echo "Environment: $ENVIRONMENT_NAME"
echo "Region: $AWS_REGION"
echo ""

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "❌ Error: Template file not found: $TEMPLATE_FILE"
  exit 1
fi

# Validate the CloudFormation template
echo "📋 Step 1: Validating CloudFormation template..."
aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
  echo "✅ Template validation successful"
else
  echo "❌ Template validation failed"
  exit 1
fi

echo ""

# Check if stack already exists
echo "🔍 Step 2: Checking if stack already exists..."
STACK_EXISTS=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  2>&1 || true)

if echo "$STACK_EXISTS" | grep -q "does not exist"; then
  echo "📦 Stack does not exist. Creating new stack..."
  OPERATION="create-stack"
  WAIT_COMMAND="stack-create-complete"
else
  echo "🔄 Stack exists. Updating stack..."
  OPERATION="update-stack"
  WAIT_COMMAND="stack-update-complete"
fi

echo ""

# Create or update the stack
echo "⚙️  Step 3: ${OPERATION//-/ }..."
aws cloudformation $OPERATION \
  --stack-name $STACK_NAME \
  --template-body file://$TEMPLATE_FILE \
  --parameters ParameterKey=EnvironmentName,ParameterValue=$ENVIRONMENT_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $AWS_REGION \
  --tags \
    Key=Environment,Value=$ENVIRONMENT_NAME \
    Key=Project,Value=job-posting-analyzer \
    Key=ManagedBy,Value=CloudFormation

if [ $? -eq 0 ]; then
  echo "✅ Stack operation initiated successfully"
else
  # Check if it's a "no updates" error
  if [ "$OPERATION" = "update-stack" ]; then
    echo "ℹ️  No updates to perform (stack is already up to date)"
    exit 0
  else
    echo "❌ Stack operation failed"
    exit 1
  fi
fi

echo ""

# Wait for stack operation to complete
echo "⏳ Step 4: Waiting for stack operation to complete..."
echo "This may take a few minutes..."
aws cloudformation wait $WAIT_COMMAND \
  --stack-name $STACK_NAME \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
  echo "✅ Stack operation completed successfully"
else
  echo "❌ Stack operation failed or timed out"
  echo ""
  echo "📋 Recent stack events:"
  aws cloudformation describe-stack-events \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --max-items 10 \
    --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' \
    --output table
  exit 1
fi

echo ""

# Retrieve and display stack outputs
echo "📊 Step 5: Retrieving stack outputs..."
echo ""
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue,Description]' \
  --output table

echo ""
echo "✅ Service Roles Stack Deployment Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Note the role ARNs from the outputs above"
echo "2. Use these ARNs when creating RDS, App Runner, and other services"
echo "3. Verify roles in IAM console: https://console.aws.amazon.com/iam/home#/roles"
echo ""
echo "🔐 Security Notes:"
echo "- All roles follow the principle of least privilege"
echo "- Trust relationships are configured for specific AWS services only"
echo "- Review and adjust policies as needed for your security requirements"
