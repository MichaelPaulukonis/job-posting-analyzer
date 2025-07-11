<!-- Generated by SpecStory -->

# Errors in analyzeWithAnthropic are getting display (2025-06-04 15:29Z)

_**User**_

Errors in analyzeWithAnthropic are getting displayed on the front-end, but we also need to see the coplete error + stack-trace on the backend, logged to the console.

---

_**Assistant**_

I'll enhance the error handling in the `analyzeWithAnthropic` function to log comprehensive error information to the backend console while still propagating errors to the front-end.

### [analyze.ts](file:///Users/michaelpaulukonis/projects/job-posting-analyzer/server/api/analyze.ts)

Add comprehensive error handling to the analyzeWithAnthropic function:

````typescript
// ...existing code...

/**
 * Analyze with Anthropic Claude API (server-side only)
 */
async function analyzeWithAnthropic(jobPosting: any, resume: any, config: any) {
  try {
    // Generate prompt
    const prompt = createAnalysisPrompt(jobPosting, resume);
    console.log('Generated prompt for Claude:', prompt);
    
    // Call Claude API
    console.log('Calling Claude API...');
    const startTime = Date.now();
    
    // // Create Anthropic client properly
    // const anthropicClient = new AnthropicClient({
    //   apiKey: config.anthropicApiKey
    // });
    
    const response = await generateText({
      model: config.anthropicModel || 'claude-3-sonnet-20240229',
      system: "You are a professional resume analysis assistant. Analyze the job posting and resume to identify matches, gaps, and provide suggestions.",
      messages: [
        { 
          role: 'user', 
          content: prompt 
        }
      ]
    });
    
    const endTime = Date.now();
    console.log(`Claude API response received in ${endTime - startTime}ms`);
    
    // Extract text content from response
    const text = response.text;
    console.log('Raw Claude response:', text);
    
    // Parse response - using the same parser as Gemini for now
    // You might need to create a specific parser for Claude if the formats differ
    return parseGeminiResponse(text);
  } catch (error: any) {
    // Log detailed error information to backend console
    console.error('Error in analyzeWithAnthropic function:');
    console.error(error); // Logs the full error object
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    // Add additional context if available in the error object
    if (error.response) {
      console.error('API response error:', error.response);
    }
    
    // Re-throw the error to be handled by the parent try-catch
    throw error;
  }
}

// ...existing code...
````

This enhancement wraps the function in a try-catch block that logs the complete error object and stack trace to the console before re-throwing the error so it can still be handled appropriately by the parent function. This provides detailed debugging information in the backend logs while preserving the existing error handling flow.

---

