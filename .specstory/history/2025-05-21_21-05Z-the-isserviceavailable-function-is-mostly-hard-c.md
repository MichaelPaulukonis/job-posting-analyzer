<!-- Generated by SpecStory -->

# the "isServiceAvailable" function is mostly hard-c (2025-05-21 21:05Z)

_**User**_

the "isServiceAvailable" function is mostly hard-coded for Gemini, so needs updating when we add new models. We do need to allow it to work for Anthropic. IT seems counter-intuitive that this would be hard-coded on a per-model basis.

---

_**Assistant**_

# Solution for Updating the Service Availability Check

Looking at the code, I see the `isServiceAvailable` function is currently hard-coded for specific models, which isn't a scalable approach. Instead, we should leverage the existing LLM service implementations that already have their own `isAvailable()` methods.

## Step-by-step approach:

1. Modify the `AnalysisService` to use a factory pattern to get the appropriate LLM service instance
2. Add a method to instantiate or retrieve LLM service instances based on service type
3. Delegate the availability check to the respective service's `isAvailable()` method

### [AnalysisService.ts](file:///Users/michaelpaulukonis/projects/job-posting-analyzer/services/AnalysisService.ts)

Update the `isServiceAvailable` function to use service implementations instead of hard-coded checks:

````typescript
import type { AnalysisResult, JobPosting, Resume } from '../types';
import { MockLLMService } from './MockLLMService';
import { GeminiLLMService } from './GeminiLLMService';
import { ClaudeLLMService } from './ClaudeLLMService';
import type { LLMServiceInterface } from './LLMServiceInterface';

export class AnalysisService {
  // ...existing code...

  /**
   * Get the appropriate LLM service instance
   */
  private static getLLMService(service: 'mock' | 'gemini' | 'openai' | 'anthropic'): LLMServiceInterface {
    switch (service) {
      case 'mock':
        return new MockLLMService();
      case 'gemini':
        return new GeminiLLMService();
      case 'anthropic':
        return new ClaudeLLMService();
      case 'openai':
        // TODO: Implement OpenAI service
        throw new Error('OpenAI service not yet implemented');
      default:
        throw new Error(`Unknown LLM service: ${service}`);
    }
  }

  /**
   * Check if a service is available
   */
  static async isServiceAvailable(service: 'mock' | 'gemini' | 'openai' | 'anthropic'): Promise<boolean> {
    try {
      // Get the appropriate service instance and delegate the availability check
      const llmService = this.getLLMService(service);
      return await llmService.isAvailable();
    } catch (error) {
      console.error(`Error checking availability for ${service}:`, error);
      return false;
    }
  }

  // ...existing code...
}
````

This approach has several advantages:
- More maintainable as new LLM services are added
- Follows the Open/Closed principle (open for extension, closed for modification)
- Delegates responsibility to the service implementations
- Handles errors gracefully, returning false if any issues occur
- Works with both existing and future LLM service implementations

The update adds a new private method `getLLMService` that returns the appropriate LLM service implementation based on the service type. The `isServiceAvailable` method then uses this to get the service instance and delegates the availability check to that service's `isAvailable()` method.

---

_**User**_

This code appears to run client-side. If so, environment variables are not available. Please fix.

---

_**Assistant**_

# Solution for Client-Side Environment Variable Access

You're absolutely right - this code appears to be running client-side where `process.env` variables are not directly accessible. In a Nuxt.js application, we should use the `useRuntimeConfig()` composable to access configuration values that have been properly exposed to the client.

## Step-by-step solution:

1. Update the `ClaudeLLMService` to use Nuxt's runtime config instead of direct environment variables
2. This approach aligns with how client-side configuration should be handled in Nuxt

### [ClaudeLLMService.ts](file:///Users/michaelpaulukonis/projects/job-posting-analyzer/services/ClaudeLLMService.ts)

Update the `isAvailable` method to use Nuxt's runtime config:

````typescript
import type { AnalysisResult, JobPosting, Resume } from '../types';
import type { LLMServiceInterface } from './LLMServiceInterface';
import { createAnalysisPrompt } from '../utils/promptUtils';
import { anthropic } from '@ai-sdk/anthropic';
import { BaseLLMService } from './BaseLLMService';
import { generateText } from 'ai';
import { useRuntimeConfig } from '#app';

export class ClaudeLLMService extends BaseLLMService implements LLMServiceInterface {
  // ...existing code...
  
  async isAvailable(): Promise<boolean> {
    try {
      // Access API key from runtime config instead of environment variables
      const config = useRuntimeConfig();
      return !!config.public.anthropicApiKey || !!config.public.anthropicApiAvailable;
    } catch (error) {
      console.error('Error checking Claude availability:', error);
      return false;
    }
  }
}
````

This change ensures that the `isAvailable` method properly checks for API availability using Nuxt's runtime configuration system, which works in both server and client environments. The method now looks for either the actual API key (if exposed as a public config value) or a boolean flag indicating API availability.

Note: You'll need to make sure your `nuxt.config.ts` file properly exposes these configuration values, something like:

```typescript
export default defineNuxtConfig({
  // ... other config
  runtimeConfig: {
    // Private keys (server only)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    // Public keys that are exposed to the client
    public: {
      anthropicApiAvailable: !!process.env.ANTHROPIC_API_KEY,
      // ... other public config
    }
  }
})
```

---

_**User**_

So this exposes the api-key to the client? If I am understanding correctly, this is unacceptable. The api-key MUST remain on the server ONLY. Correct me if I'm wrong.

---

_**Assistant**_

# Security Issue with API Key Exposure

You're absolutely correct! Exposing API keys to the client is a major security vulnerability. This must be fixed immediately.

## The problem

The current implementation attempts to access the API key in the client-side code, which would expose sensitive credentials if they were actually available there.

## Solution steps

1. Remove any references to API keys in client-side code
2. Only expose a boolean flag indicating if a service is available 
3. Move all API calls that require keys to server-side endpoints
4. Update the availability check to only check the boolean flag

### [ClaudeLLMService.ts](file:///Users/michaelpaulukonis/projects/job-posting-analyzer/services/ClaudeLLMService.ts)

```typescript
import type { AnalysisResult, JobPosting, Resume } from '../types';
import type { LLMServiceInterface } from './LLMServiceInterface';
import { createAnalysisPrompt } from '../utils/promptUtils';
import { anthropic } from '@ai-sdk/anthropic';
import { BaseLLMService } from './BaseLLMService';
import { generateText } from 'ai';
import { useRuntimeConfig } from '#app';

export class ClaudeLLMService extends BaseLLMService implements LLMServiceInterface {
  // ...existing code...
  
  async isAvailable(): Promise<boolean> {
    try {
      // ONLY check the public flag that indicates if the service is available
      // NEVER reference the actual API key in client-side code
      const config = useRuntimeConfig();
      return !!config.public.anthropicApiAvailable;
    } catch (error) {
      console.error('Error checking Claude availability:', error);
      return false;
    }
  }
}
```

This implementation ensures that:

1. We never try to access the actual API key on the client side
2. We only check the public boolean flag (`anthropicApiAvailable`) which indicates if the service is available
3. All actual API calls using the key should happen on the server through your `/api/analyze` endpoint, which you already have implemented

In your `nuxt.config.ts`, you should set up your runtime config like this:

```typescript
export default defineNuxtConfig({
  // ... other config
  runtimeConfig: {
    // Private keys (server only)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    // Public flags (exposed to the client)
    public: {
      anthropicApiAvailable: !!process.env.ANTHROPIC_API_KEY,
      // No API keys here!
    }
  }
})
```

This keeps your API keys secure while still allowing client-side code to check if a service is available.

---

_**User**_

Please make sure that analyze.ts can use the anthropic service. Currently it returns the error "Unsupported service: anthropic"

---

_**Assistant**_

# Adding Anthropic Claude Service to API Endpoint

The `analyze.ts` file needs to be updated to support the 'anthropic' service type. Currently, it only supports 'gemini' and 'mock' services, returning an error for any other service type.

## Solution

Update the server API endpoint to add support for the Anthropic Claude service:

### [analyze.ts](file:///Users/michaelpaulukonis/projects/job-posting-analyzer/server/api/analyze.ts)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAnalysisPrompt } from '~/utils/promptUtils';
import { parseGeminiResponse } from '~/utils/responseParser';
import { anthropic } from '@ai-sdk/anthropic';

export default defineEventHandler(async (event) => {
  try {
    // Get runtime config with API keys (server side only)
    const config = useRuntimeConfig();
    
    // Parse request body
    const body = await readBody(event);
    const { jobPosting, resume, service = 'gemini' } = body;
    
    console.log(`API Request: Analyzing with ${service} service`);
    
    if (!jobPosting || !resume) {
      console.log('API Error: Missing job posting or resume data');
      throw createError({
        statusCode: 400,
        message: 'Missing job posting or resume data'
      });
    }
    
    // Generate analysis based on service type
    let result;
    if (service === 'gemini') {
      // Check if API key is available
      if (!config.geminiApiKey) {
        console.log('API key missing: Gemini API key is not configured');
        throw new Error('Gemini API key is not configured');
      }
      console.log('Using Gemini service with model:', config.geminiModel);
      result = await analyzeWithGemini(jobPosting, resume, config);
    } else if (service === 'anthropic') {
      // Check if API key is available
      if (!config.anthropicApiKey) {
        console.log('API key missing: Anthropic API key is not configured');
        throw new Error('Anthropic API key is not configured');
      }
      console.log('Using Anthropic Claude service with model:', config.anthropicModel || 'default model');
      result = await analyzeWithAnthropic(jobPosting, resume, config);
    } else if (service === 'mock') {
      console.log('Using mock service');
      result = await generateMockAnalysis(jobPosting, resume);
    } else {
      console.log(`API Error: Unsupported service: ${service}`);
      throw createError({
        statusCode: 400,
        message: `Unsupported service: ${service}`
      });
    }
    
    console.log('Analysis completed successfully. Result summary:', {
      matches: result.matches.length,
      gaps: result.gaps.length,
      suggestions: result.suggestions.length
    });
    
    return result;
  } catch (error: any) {
    console.error('Error in analyze API:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Error processing analysis request'
    });
  }
});

// ...existing code...

/**
 * Analyze with Anthropic Claude API (server-side only)
 */
async function analyzeWithAnthropic(jobPosting: any, resume: any, config: any) {
  // Generate prompt
  const prompt = createAnalysisPrompt(jobPosting, resume);
  console.log('Generated prompt for Claude:', prompt);
  
  // Call Claude API
  console.log('Calling Claude API...');
  const startTime = Date.now();
  
  // Use anthropic library to make the API call
  const claude = anthropic({ apiKey: config.anthropicApiKey });
  const model = config.anthropicModel || 'claude-3-sonnet-20240229'; // Use default if not specified
  
  const response = await claude.messages.create({
    model: model,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const endTime = Date.now();
  console.log(`Claude API response received in ${endTime - startTime}ms`);
  
  // Extract text content from response
  const text = response.content[0]?.text || '';
  console.log('Raw Claude response:', text);
  
  // Parse response - using the same parser as Gemini for now
  // You might need to create a specific parser for Claude if the formats differ
  return parseGeminiResponse(text);
}

// ...existing code...
```

You'll also need to ensure that the `nuxt.config.ts` file has the appropriate runtime configuration for Anthropic:

```typescript
// In nuxt.config.ts
export default defineNuxtConfig({
  // ...other config
  runtimeConfig: {
    // Private keys (server side only)
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    
    // Add Anthropic config
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    
    // Public configuration
    public: {
      geminiApiAvailable: !!process.env.GEMINI_API_KEY,
      anthropicApiAvailable: !!process.env.ANTHROPIC_API_KEY,
      // No API keys here!
    }
  }
})
```

This implementation:
1. Adds support for the 'anthropic' service type
2. Checks for the Anthropic API key before making the request
3. Uses the Anthropic SDK to call the Claude API
4. Processes the response using the existing parser
5. Maintains the same error handling and logging patterns

---

