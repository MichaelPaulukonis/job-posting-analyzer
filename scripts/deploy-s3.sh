#!/bin/bash

# S3 Bucket Deployment Script
# Deploys the S3 bucket CloudFormation stack for file storage

set -e

STACK_NAME="job-analyzer-s3"
TEMPLATE_FILE="infra/cloudformation/s3-setup.yml"
ENVIRONMENT_NAME="job-analyzer"

echo "🚀 Deploying S3 Bucket Stack"
echo "=============================="
echo ""
echo "Stack Name: $STACK_NAME"
echo "Template: $TEMPLATE_FILE"
echo "Environment: $ENVIRONMENT_NAME"
echo ""

# Validate template
echo "📋 Validating CloudFormation template..."
aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE \
  > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Template validation successful"
else
  echo "❌ Template validation failed"
  exit 1
fi

echo ""

# Deploy stack
echo "🚢 Deploying stack..."
aws cloudformation deploy \
  --stack-name $STACK_NAME \
  --template-file $TEMPLATE_FILE \
  --parameter-overrides \
    EnvironmentName=$ENVIRONMENT_NAME \
  --tags \
    Project=job-posting-analyzer \
    Environment=$ENVIRONMENT_NAME \
    ManagedBy=CloudFormation

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Stack deployment successful"
else
  echo ""
  echo "❌ Stack deployment failed"
  exit 1
fi

echo ""
echo "📊 Stack Outputs:"
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table

echo ""
echo "🎉 S3 Bucket Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Note the bucket name from outputs above"
echo "  2. Add bucket name to .env file: S3_BUCKET_NAME=<bucket-name>"
echo "  3. Test bucket access with: aws s3 ls s3://<bucket-name>"
echo "  4. Proceed to Task 6: S3 Service Implementation"
echo ""
