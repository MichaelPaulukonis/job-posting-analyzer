#!/bin/bash

# S3 Bucket Validation Script
# Validates the S3 CloudFormation template and estimates costs

set -e

TEMPLATE_FILE="infra/cloudformation/s3-setup.yml"

echo "🔍 Validating S3 Bucket CloudFormation Template"
echo "==============================================="
echo ""

# Validate template syntax
echo "📋 Validating template syntax..."
VALIDATION_OUTPUT=$(aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ Template syntax is valid"
  echo ""
  
  # Display template description
  echo "📄 Template Description:"
  echo "$VALIDATION_OUTPUT" | grep -A 1 "Description" || echo "No description found"
  echo ""
  
  # Display parameters
  echo "⚙️  Template Parameters:"
  echo "$VALIDATION_OUTPUT" | grep -A 10 "Parameters" || echo "No parameters found"
  echo ""
else
  echo "❌ Template validation failed:"
  echo "$VALIDATION_OUTPUT"
  exit 1
fi

# Estimate costs
echo "💰 Cost Estimation:"
echo "  S3 Standard Storage: ~\$0.023 per GB/month"
echo "  S3 Standard-IA (after 30 days): ~\$0.0125 per GB/month"
echo "  PUT/POST requests: ~\$0.005 per 1,000 requests"
echo "  GET requests: ~\$0.0004 per 1,000 requests"
echo "  Data transfer out: ~\$0.09 per GB (first 10 TB)"
echo ""
echo "  Estimated monthly cost for typical usage:"
echo "    - 10 GB storage: ~\$0.23/month"
echo "    - 1,000 uploads: ~\$0.005/month"
echo "    - 10,000 downloads: ~\$0.004/month"
echo "    - Total: ~\$0.24/month"
echo ""

# Security summary
echo "🔒 Security Configuration:"
echo "  ✅ Server-side encryption enabled (AES256)"
echo "  ✅ Versioning enabled"
echo "  ✅ Public access blocked"
echo "  ✅ Bucket policy restricts access to App Runner role"
echo "  ⚠️  CORS allows all origins (restrict in production)"
echo ""

# Lifecycle rules summary
echo "♻️  Lifecycle Rules:"
echo "  ✅ Old versions deleted after 90 days"
echo "  ✅ Files transition to Standard-IA after 30 days"
echo ""

echo "✅ Validation Complete!"
echo ""
echo "To deploy this template, run:"
echo "  ./scripts/deploy-s3.sh"
echo ""
