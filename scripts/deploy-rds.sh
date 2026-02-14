#!/bin/bash
# Deploy RDS PostgreSQL instance with pgvector support

set -e

STACK_NAME="job-analyzer-rds"
TEMPLATE_FILE="infra/cloudformation/rds-setup.yml"
REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Deploying RDS PostgreSQL Stack..."
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo ""

# Validate template
echo "📋 Validating CloudFormation template..."
aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE \
  --region $REGION

# Prompt for database password
echo ""
read -s -p "Enter database master password (min 8 characters): " DB_PASSWORD
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

# Deploy stack
echo "🔨 Creating CloudFormation stack..."
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://$TEMPLATE_FILE \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=job-analyzer \
    ParameterKey=DBInstanceClass,ParameterValue=db.t4g.micro \
    ParameterKey=DBAllocatedStorage,ParameterValue=20 \
    ParameterKey=DBName,ParameterValue=jobanalyzer \
    ParameterKey=DBUsername,ParameterValue=dbadmin \
    ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
  --region $REGION

echo ""
echo "⏳ Waiting for stack creation to complete (this may take 5-10 minutes)..."
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --region $REGION

echo ""
echo "✅ Stack created successfully!"
echo ""
echo "📊 Stack Outputs:"
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table

echo ""
echo "🔐 Save these connection details securely:"
echo "   - Database endpoint is exported as 'job-analyzer-db-endpoint'"
echo "   - Database port is exported as 'job-analyzer-db-port'"
echo "   - Database name is exported as 'job-analyzer-db-name'"
echo ""
echo "⚠️  IMPORTANT: Store the database password in AWS Secrets Manager or your .env file"
echo ""
echo "🎯 Next steps:"
echo "   1. Test connection: psql -h <endpoint> -U dbadmin -d jobanalyzer"
echo "   2. Enable pgvector extension (see subtask 2.3)"
echo "   3. Configure security group rules (see subtask 2.2)"
