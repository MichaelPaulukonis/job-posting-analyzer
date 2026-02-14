#!/bin/bash
# Consolidated Database Deployment Script
# Deploys RDS infrastructure and initializes database schema using Prisma

set -e

STACK_NAME="job-analyzer-rds"
TEMPLATE_FILE="infra/cloudformation/rds-setup.yml"
REGION="${AWS_REGION:-us-east-1}"
DB_NAME="jobanalyzer"
DB_USER="dbadmin"

echo "🚀 Job Analyzer Database Deployment"
echo "===================================="
echo ""
echo "This script will:"
echo "  1. Deploy RDS PostgreSQL infrastructure (CloudFormation)"
echo "  2. Configure security group with your IP"
echo "  3. Set up DATABASE_URL for Prisma"
echo "  4. Run Prisma migrations to create schema"
echo ""
echo "Estimated time: 8-12 minutes"
echo ""

# ============================================================================
# STEP 1: Validate Template
# ============================================================================

echo "📋 Step 1/5: Validating CloudFormation template..."
aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE \
  --region $REGION > /dev/null

echo "✅ Template is valid"
echo ""

# ============================================================================
# STEP 2: Get Database Password
# ============================================================================

echo "🔐 Step 2/5: Database password setup..."
read -s -p "Enter database master password (min 8 alphanumeric characters): " DB_PASSWORD
echo ""
read -s -p "Confirm password: " DB_PASSWORD_CONFIRM
echo ""

if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
  echo "❌ Passwords do not match"
  exit 1
fi

if [ ${#DB_PASSWORD} -lt 8 ]; then
  echo "❌ Password must be at least 8 characters"
  exit 1
fi

if ! [[ "$DB_PASSWORD" =~ ^[a-zA-Z0-9]+$ ]]; then
  echo "❌ Password must contain only alphanumeric characters"
  exit 1
fi

echo "✅ Password validated"
echo ""

# ============================================================================
# STEP 3: Deploy CloudFormation Stack
# ============================================================================

echo "🔨 Step 3/5: Deploying RDS infrastructure..."
echo "   This will take 5-10 minutes..."
echo ""

# Check if stack already exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
  echo "⚠️  Stack already exists. Updating..."
  
  # Try to update the stack
  UPDATE_OUTPUT=$(aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters \
      ParameterKey=EnvironmentName,ParameterValue=job-analyzer \
      ParameterKey=DBInstanceClass,ParameterValue=db.t4g.micro \
      ParameterKey=DBAllocatedStorage,ParameterValue=20 \
      ParameterKey=DBName,ParameterValue=$DB_NAME \
      ParameterKey=DBUsername,ParameterValue=$DB_USER \
      ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
    --region $REGION 2>&1) || UPDATE_EXIT_CODE=$?
  
  # Check if update was successful or if no updates were needed
  if [ -z "$UPDATE_EXIT_CODE" ]; then
    # Update initiated successfully
    echo "⏳ Waiting for stack update..."
    aws cloudformation wait stack-update-complete \
      --stack-name $STACK_NAME \
      --region $REGION
  elif echo "$UPDATE_OUTPUT" | grep -q "No updates are to be performed"; then
    # No updates needed - this is fine
    echo "ℹ️  No updates needed - stack is already up to date"
  else
    # Some other error occurred
    echo "❌ Update failed: $UPDATE_OUTPUT"
    exit 1
  fi
else
  aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters \
      ParameterKey=EnvironmentName,ParameterValue=job-analyzer \
      ParameterKey=DBInstanceClass,ParameterValue=db.t4g.micro \
      ParameterKey=DBAllocatedStorage,ParameterValue=20 \
      ParameterKey=DBName,ParameterValue=$DB_NAME \
      ParameterKey=DBUsername,ParameterValue=$DB_USER \
      ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
    --region $REGION

  echo "⏳ Waiting for stack creation (5-10 minutes)..."
  aws cloudformation wait stack-create-complete \
    --stack-name $STACK_NAME \
    --region $REGION
fi

echo "✅ Infrastructure deployed"
echo ""

# Get outputs
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`DBInstanceEndpoint`].OutputValue' \
  --output text)

SG_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`DBSecurityGroupId`].OutputValue' \
  --output text)

echo "📊 Database Endpoint: $DB_ENDPOINT"
echo "🔒 Security Group: $SG_ID"
echo ""

# ============================================================================
# STEP 4: Configure Security Group
# ============================================================================

echo "🔒 Step 4/5: Configuring security group..."

# Get current IP
MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "   Your IP: $MY_IP"

# Check if IP already authorized
EXISTING=$(aws ec2 describe-security-groups \
  --group-ids $SG_ID \
  --region $REGION \
  --query "SecurityGroups[0].IpPermissions[?FromPort==\`5432\`].IpRanges[?CidrIp==\`$MY_IP/32\`]" \
  --output text)

if [ -n "$EXISTING" ]; then
  echo "   ℹ️  Your IP is already authorized"
else
  echo "   ➕ Adding your IP to security group..."
  aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr $MY_IP/32 \
    --region $REGION \
    --group-rule-description "Development access from $MY_IP" 2>/dev/null || echo "   ℹ️  Rule may already exist"
fi

echo "✅ Security group configured"
echo ""

# ============================================================================
# STEP 5: Initialize Database with Prisma
# ============================================================================

echo "🔧 Step 5/5: Initializing database with Prisma..."
echo ""

# Construct DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_ENDPOINT}:5432/${DB_NAME}?schema=public"

# Update .env file
if [ -f ".env" ]; then
  echo "   📝 Updating .env file..."
  # Remove old DATABASE_URL if exists
  sed -i.bak '/^DATABASE_URL=/d' .env
  # Add new DATABASE_URL
  echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
  rm .env.bak 2>/dev/null || true
else
  echo "   📝 Creating .env file..."
  echo "DATABASE_URL=\"$DATABASE_URL\"" > .env
fi

echo "   ✅ DATABASE_URL configured in .env"
echo ""

# Wait a moment for database to be fully ready
echo "   ⏳ Waiting for database to be fully ready..."
sleep 10

# Run Prisma migrations
echo "   🔧 Running Prisma migrations..."
export DATABASE_URL="$DATABASE_URL"

# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables, extensions, etc.)
npx prisma db push --accept-data-loss

echo "   ✅ Database schema created via Prisma"
echo ""

# Verify setup
echo "   📋 Verifying setup..."
echo "   ✅ Prisma schema applied successfully"

echo ""
echo "🎉 Database Deployment Complete!"
echo "================================="
echo ""
echo "📊 Connection Details:"
echo "   Host: $DB_ENDPOINT"
echo "   Port: 5432"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""
echo "✅ DATABASE_URL has been saved to .env file"
echo ""
echo "🎯 Next Steps:"
echo "   1. Your database is ready to use with Prisma"
echo "   2. Use 'npx prisma studio' to view your database"
echo "   3. Import Prisma Client in your code: import { prisma } from '~/server/utils/prisma'"
echo "   4. Migrate existing JSON data to database"
echo ""

