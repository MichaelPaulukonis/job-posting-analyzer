#!/bin/bash
# Validate RDS CloudFormation template

set -e

TEMPLATE_FILE="infra/cloudformation/rds-setup.yml"
REGION="${AWS_REGION:-us-east-1}"

echo "🔍 Validating RDS CloudFormation template..."
echo "Template: $TEMPLATE_FILE"
echo "Region: $REGION"
echo ""

# Validate template syntax
aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE \
  --region $REGION

echo ""
echo "✅ Template validation successful!"
echo ""
echo "📋 Template Summary:"
echo "   - Creates VPC with 2 subnets across AZs"
echo "   - Creates DB subnet group"
echo "   - Creates security group for PostgreSQL (port 5432)"
echo "   - Creates DB parameter group with pgvector support"
echo "   - Creates RDS PostgreSQL 15.8 instance (db.t4g.micro)"
echo "   - Enables automated backups (7-day retention)"
echo "   - Enables CloudWatch logs export"
echo ""
echo "🔐 Security Features:"
echo "   - Storage encryption enabled"
echo "   - Deletion protection disabled (for dev)"
echo "   - Snapshot on deletion enabled"
echo ""
echo "💰 Cost Estimate:"
echo "   - db.t4g.micro: ~$12-15/month"
echo "   - 20GB gp3 storage: ~$2.30/month"
echo "   - Backup storage: First 20GB free"
echo "   - Total: ~$15-20/month"
echo ""
echo "🚀 Ready to deploy! Run: ./scripts/deploy-rds.sh"
