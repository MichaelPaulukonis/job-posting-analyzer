#!/bin/bash
# Configure RDS security group for development and App Runner access

set -e

STACK_NAME="job-analyzer-rds"
REGION="${AWS_REGION:-us-east-1}"

echo "🔒 Configuring Database Security Group..."
echo ""

# Get security group ID from stack
echo "📋 Retrieving security group from CloudFormation stack..."
SG_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`DBSecurityGroupId`].OutputValue' \
  --output text)

if [ -z "$SG_ID" ]; then
  echo "❌ Could not find security group ID from stack outputs"
  exit 1
fi

echo "✅ Security Group ID: $SG_ID"
echo ""

# Get current public IP
echo "🌐 Detecting your current public IP..."
MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "✅ Your IP: $MY_IP"
echo ""

# Check existing rules
echo "📋 Current security group rules:"
aws ec2 describe-security-groups \
  --group-ids $SG_ID \
  --region $REGION \
  --query 'SecurityGroups[0].IpPermissions[*].[FromPort,ToPort,IpRanges[*].CidrIp,IpRanges[*].Description]' \
  --output table

echo ""
read -p "Do you want to add your current IP ($MY_IP/32) to the security group? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "➕ Adding your IP to security group..."
  
  # Check if rule already exists
  EXISTING=$(aws ec2 describe-security-groups \
    --group-ids $SG_ID \
    --region $REGION \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`5432\`].IpRanges[?CidrIp==\`$MY_IP/32\`]" \
    --output text)
  
  if [ -n "$EXISTING" ]; then
    echo "ℹ️  Your IP is already authorized"
  else
    aws ec2 authorize-security-group-ingress \
      --group-id $SG_ID \
      --protocol tcp \
      --port 5432 \
      --cidr $MY_IP/32 \
      --region $REGION \
      --group-rule-description "Development access from $MY_IP"
    
    echo "✅ Successfully added your IP to security group"
  fi
fi

echo ""
echo "🔧 Additional Configuration Options:"
echo ""
echo "1. Add specific IP range:"
echo "   aws ec2 authorize-security-group-ingress \\"
echo "     --group-id $SG_ID \\"
echo "     --protocol tcp --port 5432 \\"
echo "     --cidr <IP_RANGE>/32 \\"
echo "     --group-rule-description 'Description'"
echo ""
echo "2. Add App Runner security group (after App Runner is created):"
echo "   aws ec2 authorize-security-group-ingress \\"
echo "     --group-id $SG_ID \\"
echo "     --protocol tcp --port 5432 \\"
echo "     --source-group <APP_RUNNER_SG_ID> \\"
echo "     --group-rule-description 'App Runner access'"
echo ""
echo "3. Remove a rule:"
echo "   aws ec2 revoke-security-group-ingress \\"
echo "     --group-id $SG_ID \\"
echo "     --protocol tcp --port 5432 \\"
echo "     --cidr <IP_RANGE>/32"
echo ""
echo "📊 View current rules:"
echo "   aws ec2 describe-security-groups --group-ids $SG_ID"
echo ""
echo "✅ Security group configuration complete!"
