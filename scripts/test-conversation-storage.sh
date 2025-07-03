#!/bin/bash

# Test script to verify conversation storage is working

echo "Testing conversation storage..."

# Test data
CONVERSATION_DATA='{
  "id": "test-conv-123",
  "analysisId": "test-analysis-456", 
  "messages": [
    {
      "role": "system",
      "content": "You are a professional cover letter writer.",
      "timestamp": "2025-01-01T00:00:00.000Z"
    },
    {
      "role": "user", 
      "content": "Please write a cover letter for a software engineer position.",
      "timestamp": "2025-01-01T00:01:00.000Z"
    },
    {
      "role": "assistant",
      "content": "I would be happy to write a cover letter for the software engineer position...",
      "timestamp": "2025-01-01T00:02:00.000Z"
    }
  ],
  "currentContent": "I would be happy to write a cover letter for the software engineer position...",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:02:00.000Z"
}'

echo "1. Testing conversation save..."
curl -X POST http://localhost:3000/api/storage/conversations \
  -H "Content-Type: application/json" \
  -d "$CONVERSATION_DATA" \
  -w "\nStatus: %{http_code}\n"

echo -e "\n2. Testing conversation retrieval..."
curl -X GET http://localhost:3000/api/storage/conversations \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

echo -e "\n3. Testing conversation retrieval by analysis ID..."
curl -X GET "http://localhost:3000/api/storage/conversations?analysisId=test-analysis-456" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

echo -e "\nTest complete!"
