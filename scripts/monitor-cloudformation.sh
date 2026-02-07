#!/bin/bash

# CloudFormation Stack Monitoring Script
# Monitors the job-analyzer-iam stack and retrieves outputs once complete

STACK_NAME="job-analyzer-iam"
MAX_WAIT_TIME=600  # 10 minutes in seconds
CHECK_INTERVAL=10   # Check every 10 seconds

echo "🔍 Monitoring CloudFormation Stack: $STACK_NAME"
echo "⏱️  Max wait time: $((MAX_WAIT_TIME / 60)) minutes"
echo ""

start_time=$(date +%s)

while true; do
  current_time=$(date +%s)
  elapsed=$((current_time - start_time))
  
  # Check if max wait time exceeded
  if [ $elapsed -gt $MAX_WAIT_TIME ]; then
    echo "❌ Timeout: Stack creation took longer than $((MAX_WAIT_TIME / 60)) minutes"
    exit 1
  fi
  
  # Get stack status
  status=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null)
  
  if [ -z "$status" ]; then
    echo "⏳ Stack initializing... ($elapsed seconds elapsed)"
  else
    echo "📊 Stack Status: $status ($elapsed seconds elapsed)"
    
    if [[ "$status" == "CREATE_COMPLETE" ]]; then
      echo ""
      echo "✅ Stack creation COMPLETE!"
      echo ""
      echo "📋 Retrieving stack outputs..."
      aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
      
      echo ""
      echo "📝 IMPORTANT: Save the AccessKeyId and SecretAccessKey to .env file"
      echo "⚠️  Never commit .env to git!"
      exit 0
      
    elif [[ "$status" == "CREATE_FAILED" ]] || [[ "$status" == "ROLLBACK_COMPLETE" ]]; then
      echo ""
      echo "❌ Stack creation FAILED!"
      echo ""
      echo "Error details:"
      aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME" \
        --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceStatusReason]' \
        --output table
      exit 1
    fi
  fi
  
  sleep $CHECK_INTERVAL
done
