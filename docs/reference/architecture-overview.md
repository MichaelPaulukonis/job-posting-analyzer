# Architecture Overview

*Part of Repository Analysis - July 1, 2025*

## System Architecture

The Job Posting Analyzer follows a modern full-stack architecture with clear separation of concerns and pluggable AI service integration.

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Vue.js SPA]
        Router[Nuxt Router]
        State[Composables]
        Storage[Local Storage]
    end
    
    subgraph "Server Layer"
        API[Nuxt Server API]
        Services[Server Services]
        Repositories[Data Repositories]
        FileStorage[File Storage]
    end
    
    subgraph "External Services"
        Gemini[Google Gemini API]
        Claude[Anthropic Claude API]
        Mock[Mock Service]
    end
    
    UI --> Router
    Router --> State
    State --> API
    API --> Services
    Services --> Repositories
    Services --> Gemini
    Services --> Claude
    Services --> Mock
    Repositories --> FileStorage
    State --> Storage
```

## Component Architecture

### Frontend Components

```mermaid
graph TD
    App[app.vue] --> Layout[default.vue]
    Layout --> Pages[Pages Directory]
    Pages --> Index[index.vue - Landing]
    Pages --> Analyze[analyze.vue - Main App]
    Pages --> Admin[admin.vue - Management]
    
    Analyze --> InputContainer[Input Components]
    Analyze --> AnalysisResults[Analysis Display]
    Analyze --> CoverLetter[Cover Letter Gen]
    
    InputContainer --> JobInput[Job Posting Input]
    InputContainer --> ResumeInput[Resume Input]
    InputContainer --> ServiceSelector[AI Service Selection]
    
    AnalysisResults --> SkillMatch[Skill Matching]
    AnalysisResults --> GapAnalysis[Gap Analysis]
    AnalysisResults --> Suggestions[Suggestions]
```

### Service Layer Architecture

```mermaid
classDiagram
    class LLMServiceInterface {
        <<interface>>
        +analyzeJobPosting()
        +getServiceName()
        +isAvailable()
    }
    
    class LLMServiceFactory {
        +createService(serviceName)
        +getAvailableServices()
    }
    
    class GeminiLLMService {
        +analyzeJobPosting()
        +getServiceName()
        +isAvailable()
    }
    
    class ClaudeLLMService {
        +analyzeJobPosting()
        +getServiceName()
        +isAvailable()
    }
    
    class MockLLMService {
        +analyzeJobPosting()
        +getServiceName()
        +isAvailable()
    }
    
    LLMServiceInterface <|-- GeminiLLMService
    LLMServiceInterface <|-- ClaudeLLMService
    LLMServiceInterface <|-- MockLLMService
    LLMServiceFactory --> LLMServiceInterface
```

## Data Flow Architecture

### Analysis Request Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Vue Component
    participant Composable as useAnalysis
    participant API as /api/analyze
    participant Factory as LLMServiceFactory
    participant Service as AI Service
    participant Storage as Local Storage
    
    User->>UI: Submit job posting & resume
    UI->>Composable: analyzeJobPosting()
    Composable->>API: POST /api/analyze
    API->>Factory: createService(serviceName)
    Factory->>Service: analyzeJobPosting()
    Service-->>API: AnalysisResult
    API-->>Composable: AnalysisResult
    Composable->>Storage: saveAnalysis()
    Composable-->>UI: Update reactive state
    UI-->>User: Display results
```

### Cover Letter Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Cover Letter Component
    participant API as /api/cover-letter/generate
    participant Service as AI Service
    participant Storage as Local Storage
    
    User->>UI: Request cover letter
    UI->>API: POST with analysis data
    API->>Service: generateCoverLetter()
    Service-->>API: Generated letter
    API-->>UI: Cover letter content
    UI->>Storage: Save cover letter
    UI-->>User: Display letter with edit options
```

## Key Architectural Decisions

### 1. AI Service Abstraction

**Decision**: Implement pluggable AI service architecture
**Rationale**: 
- Multiple AI providers with different strengths
- Future-proofing against API changes
- Cost optimization through provider switching
- Fallback capabilities

**Implementation**:
```typescript
interface LLMServiceInterface {
  analyzeJobPosting(jobPosting: JobPosting, resume: Resume): Promise<AnalysisResult>;
  getServiceName(): string;
  isAvailable(): Promise<boolean>;
}
```

### 2. Client-Side Storage Strategy

**Decision**: Use local storage for MVP
**Rationale**:
- Rapid prototyping and development
- No backend complexity
- Privacy-first approach
- Offline capability

**Trade-offs**:
- Limited to single device
- Storage size constraints
- No collaboration features

### 3. Nuxt.js Full-Stack Architecture

**Decision**: Use Nuxt.js for both frontend and API
**Rationale**:
- Single framework for full stack
- Built-in API routes
- Excellent TypeScript support
- Deployment simplicity

### 4. File-Based Server Storage

**Decision**: JSON files for server-side persistence
**Rationale**:
- Simple deployment
- No database overhead
- Easy backup and migration
- Development simplicity

## Component Patterns

### 1. Composition API Pattern

```typescript
// Consistent composable pattern
export function useAnalysis() {
  const state = reactive({...});
  const loading = ref(false);
  
  const methods = {
    async analyzeJob() { ... },
    async saveAnalysis() { ... }
  };
  
  return {
    // Reactive state
    ...toRefs(state),
    loading,
    // Methods
    ...methods
  };
}
```

### 2. Service Layer Pattern

```typescript
// Consistent service interface
abstract class BaseLLMService implements LLMServiceInterface {
  protected abstract apiKey: string;
  protected abstract modelName: string;
  
  abstract analyzeJobPosting(): Promise<AnalysisResult>;
  
  // Shared functionality
  protected handleError(error: Error): never {
    // Consistent error handling
  }
}
```

### 3. Repository Pattern

```typescript
// Data access abstraction
export class AnalysisRepository {
  async save(analysis: SavedAnalysis): Promise<void> { ... }
  async findById(id: string): Promise<SavedAnalysis | null> { ... }
  async findAll(): Promise<SavedAnalysis[]> { ... }
  async delete(id: string): Promise<void> { ... }
}
```

## Security Architecture

### Current Security Measures

1. **API Key Management**
   - Server-side only storage
   - Environment variable configuration
   - No client-side exposure

2. **Input Validation**
   - Basic content length limits
   - File type restrictions
   - Sanitization (needs improvement)

3. **CORS Configuration**
   - Default Nuxt CORS settings
   - Needs tightening for production

### Security Gaps

1. **Rate Limiting**: Not implemented
2. **Input Sanitization**: Incomplete
3. **CSP Headers**: Not configured
4. **Authentication**: Not implemented

## Performance Architecture

### Current Optimizations

1. **Lazy Loading**
   - Components loaded on demand
   - Route-based code splitting

2. **Caching**
   - Local storage for repeated data
   - Browser caching for static assets

3. **Bundle Optimization**
   - Nuxt's built-in optimizations
   - Tree shaking enabled

### Performance Bottlenecks

1. **PDF Processing**: Blocks main thread
2. **Large Responses**: No pagination
3. **Multiple AI Calls**: No batching

## Scalability Considerations

### Current Limitations

1. **Storage**: Local storage size limits
2. **Concurrent Users**: No load balancing
3. **AI Services**: No queue management
4. **File Processing**: Memory constraints

### Scaling Strategy

```mermaid
graph TB
    subgraph "Current Architecture"
        A[Single Instance]
        B[Local Storage]
        C[Direct AI Calls]
    end
    
    subgraph "Scaled Architecture"
        D[Load Balancer]
        E[Multiple Instances]
        F[Database Cluster]
        G[Message Queue]
        H[Cache Layer]
        I[CDN]
    end
    
    A --> D
    B --> F
    C --> G
    
    D --> E
    E --> H
    H --> F
    E --> G
    I --> E
```

## Technology Stack Rationale

### Frontend Stack

| Technology | Reason | Alternatives Considered |
|------------|--------|------------------------|
| Nuxt.js 3 | Full-stack capabilities, TypeScript support | Next.js, Vite+Vue |
| Vue.js 3 | Composition API, reactivity | React, Svelte |
| TypeScript | Type safety, better tooling | JavaScript |
| Tailwind CSS | Utility-first, rapid development | Bootstrap, Styled Components |

### Backend Stack

| Technology | Reason | Alternatives Considered |
|------------|--------|------------------------|
| Nitro | Nuxt's server engine | Express.js, Fastify |
| Node.js 23 | Latest features, performance | Node.js 18/20 |
| File Storage | Simplicity, no dependencies | PostgreSQL, MongoDB |

### AI Integration

| Service | Reason | Alternatives |
|---------|--------|--------------|
| Google Gemini | Good performance, competitive pricing | OpenAI GPT |
| Anthropic Claude | Strong reasoning, safety focus | OpenAI GPT |
| Mock Service | Development, testing | N/A |

## Deployment Architecture

### Development Environment

```mermaid
graph LR
    Dev[Developer] --> Local[Local Environment]
    Local --> HMR[Hot Module Reload]
    Local --> Mock[Mock AI Services]
    Local --> LocalStorage[Local Storage]
```

### Production Environment

```mermaid
graph TB
    User[Users] --> CDN[CDN/Edge Cache]
    CDN --> LB[Load Balancer]
    LB --> App1[App Instance 1]
    LB --> App2[App Instance 2]
    App1 --> AI[AI Services]
    App2 --> AI
    App1 --> Storage[Persistent Storage]
    App2 --> Storage
```

## Future Architecture Considerations

### 1. Microservices Evolution

```mermaid
graph TB
    subgraph "Current Monolith"
        Nuxt[Nuxt.js App]
    end
    
    subgraph "Future Microservices"
        UI[Frontend SPA]
        Auth[Auth Service]
        Analysis[Analysis Service]
        Storage[Storage Service]
        AI[AI Gateway]
    end
    
    Nuxt -.-> UI
    Nuxt -.-> Auth
    Nuxt -.-> Analysis
    Nuxt -.-> Storage
    Nuxt -.-> AI
```

### 2. Event-Driven Architecture

For future scalability, consider implementing event-driven patterns:

- Analysis completion events
- User activity tracking
- Async processing queues
- Real-time notifications

### 3. API Gateway Pattern

As the system grows, implement an API gateway for:

- Rate limiting
- Authentication/authorization
- Request routing
- Response caching
- Monitoring and analytics

---

This architecture overview provides the foundation for understanding the current system and planning future enhancements. The modular design allows for incremental improvements while maintaining system stability.
