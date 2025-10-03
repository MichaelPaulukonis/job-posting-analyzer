# Cover Letter API Documentation

## Conversation-Aware Cover Letter Generation

### Generate Cover Letter with Context

**Endpoint:** `POST /api/cover-letter/generate`

**Enhanced for conversation context** - maintains conversation history across regenerations.

#### Request Body
```typescript
{
  analysisId: string;              // Required: ID of the job analysis
  serviceName: ServiceName;        // Required: AI service to use ('gemini', 'anthropic', 'openai', 'mock')
  conversationId?: string;         // Optional: Existing conversation ID for context
  sampleLetter?: string;           // Optional: Sample letter for style reference
  instructions?: string;           // Optional: User instructions for generation/regeneration
  referenceContent?: string;       // Optional: Previous content to use as reference
}
```

#### Response
```typescript
{
  coverLetter: {
    content: string;               // Generated cover letter text
    timestamp: string;             // Generation timestamp
    sampleContent?: string;        // Sample letter used (if any)
  };
  conversation: {
    id: string;                    // Conversation ID for future requests
    analysisId: string;            // Linked analysis ID
    messages: ConversationMessage[]; // Full message history
    currentContent: string;        // Current cover letter content
    createdAt: string;             // Conversation creation time
    updatedAt: string;             // Last update time
  };
}
```

#### Conversation Flow Examples

**Initial Generation:**
```bash
curl -X POST /api/cover-letter/generate \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "analysis-123",
    "serviceName": "gemini"
  }'
```

**Regeneration with Context:**
```bash
curl -X POST /api/cover-letter/generate \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "analysis-123", 
    "serviceName": "gemini",
    "conversationId": "conv-456",
    "instructions": "Make it more technical and less formal"
  }'
```

## Conversation Storage

### Save Conversation

**Endpoint:** `POST /api/storage/conversations`

Persists conversation data for later retrieval.

#### Request Body
```typescript
{
  id: string;                      // Conversation ID
  analysisId: string;              // Linked analysis ID
  messages: ConversationMessage[]; // Message history
  currentContent: string;          // Current cover letter
  createdAt: string;               // Creation timestamp
  updatedAt: string;               // Update timestamp
}
```

#### Response
```typescript
{
  success: boolean;
  id: string;                      // Saved conversation ID
}
```

### Get Conversations

**Endpoint:** `GET /api/storage/conversations`

Retrieves all stored conversations.

#### Response
```typescript
CoverLetterConversation[]          // Array of conversation objects
```

## Message Structure

### ConversationMessage
```typescript
{
  role: 'system' | 'user' | 'assistant';  // Message sender
  content: string;                         // Message content
  timestamp: string;                       // Message timestamp
  metadata?: {                             // Optional metadata
    instructions?: string;                 // User instructions
    sampleLetter?: string;                 // Sample letter reference
    referenceContent?: string;             // Reference content
  };
}
```

### Message Types

**System Messages:**
- Initial context about job analysis
- Instructions about cover letter generation
- Role: `'system'`

**User Messages:**
- User instructions and feedback
- Regeneration requests
- Role: `'user'`

**Assistant Messages:**
- AI-generated cover letters
- AI responses to user requests
- Role: `'assistant'`

## Error Handling

### Common Error Responses

**400 Bad Request:**
```typescript
{
  statusCode: 400,
  statusMessage: "Invalid conversation data"
}
```

**404 Not Found:**
```typescript
{
  statusCode: 404, 
  statusMessage: "Analysis not found"
}
```

**500 Internal Server Error:**
```typescript
{
  statusCode: 500,
  statusMessage: "Failed to generate cover letter"
}
```

### Fallback Behavior

If server storage fails:
1. API continues to function for cover letter generation
2. Conversation automatically saved to localStorage
3. Warning logged but operation continues
4. User experience remains uninterrupted

## Integration Examples

### Frontend Integration

```typescript
// Generate with conversation context
const result = await CoverLetterService.generateCoverLetterWithContext(
  analysis,
  currentConversation?.id,  // Use existing conversation
  sampleLetter,
  instructions,
  referenceContent,
  selectedService
);

// Update local state
coverLetter.content = result.coverLetter.content;
currentConversation.value = result.conversation;
```

### Service Layer

```typescript
// CoverLetterService implementation
export class CoverLetterService {
  static async generateCoverLetterWithContext(
    analysis: SavedAnalysis,
    conversationId?: string,
    sampleLetter?: string,
    instructions?: string,
    referenceContent?: string,
    serviceName: ServiceName = 'gemini'
  ): Promise<{ coverLetter: CoverLetter; conversation: CoverLetterConversation }> {
    // Implementation handles conversation management automatically
  }
}
```

## Configuration

### Runtime Config Requirements

```typescript
// nuxt.config.ts
runtimeConfig: {
  public: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.BASE_URL || 'http://localhost:3000'
  }
}
```

### Environment Variables

- `BASE_URL` - Primary base URL for API calls
- `NUXT_PUBLIC_API_BASE` - Optional override for API base URL

## Best Practices

### Token Management
- Monitor conversation length to manage AI API costs
- Consider implementing conversation length limits
- Provide "start fresh" option for very long conversations

### Storage Strategy
- Use server storage as primary
- localStorage as automatic fallback
- Clean up old conversations periodically

### Error Handling
- Always implement graceful fallbacks
- Log errors for debugging but don't block user flow
- Validate conversation data before storage

### User Experience
- Show conversation history for transparency
- Provide clear feedback on conversation state
- Make regeneration instructions prominent and easy to use
