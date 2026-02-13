#!/bin/bash

# Service Roles CloudFormation Template Validation Script
# Validates the template syntax and checks for common issues

set -e  # Exit on error

TEMPLATE_FILE="infra/cloudformation/service-roles.yml"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🔍 Validating Service Roles CloudFormation Template"
echo "===================================================="
echo "Template: $TEMPLATE_FILE"
echo "Region: $AWS_REGION"
echo ""

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "❌ Error: Template file not found: $TEMPLATE_FILE"
  exit 1
fi

# Validate the CloudFormation template
echo "📋 Validating CloudFormation template syntax..."
VALIDATION_OUTPUT=$(aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE \
  --region $AWS_REGION 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ Template validation successful"
  echo ""
  
  # Display template parameters
  echo "📝 Template Parameters:"
  echo "$VALIDATION_OUTPUT" | grep -A 10 "Parameters" || echo "  No parameters found"
  echo ""
  
  # Display template description
  echo "📄 Template Description:"
  echo "$VALIDATION_OUTPUT" | grep "Description" | head -1 || echo "  No description found"
  echo ""
  
  # Check for IAM capabilities requirement
  if grep -q "AWS::IAM::Role" "$TEMPLATE_FILE"; then
    echo "⚠️  This template creates IAM roles"
    echo "   Deployment requires: --capabilities CAPABILITY_NAMED_IAM"
    echo ""
  fi
  
  # Count resources
  RESOURCE_COUNT=$(grep -c "Type: AWS::" "$TEMPLATE_FILE" || echo "0")
  echo "📊 Resources defined: $RESOURCE_COUNT"
  echo ""
  
  # List resource types
  echo "🔧 Resource Types:"
  grep "Type: AWS::" "$TEMPLATE_FILE" | sed 's/.*Type: /  - /' | sort | uniq -c
  echo ""
  
  echo "✅ Validation Complete - Template is ready for deployment"
  echo ""
  echo "📝 Next Steps:"
  echo "1. Review the template: cat $TEMPLATE_FILE"
  echo "2. Deploy the stack: ./scripts/deploy-service-roles.sh"
  echo "3. Or deploy manually:"
  echo "   aws cloudformation create-stack \\"
  echo "     --stack-name job-analyzer-service-roles \\"
  echo "     --template-body file://$TEMPLATE_FILE \\"
  echo "     --capabilities CAPABILITY_NAMED_IAM"
  
else
  echo "❌ Template validation failed"
  echo ""
  echo "Error details:"
  echo "$VALIDATION_OUTPUT"
  exit 1
fi
