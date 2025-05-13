# various APIs

## ideas and TODOs

- links to info on models
- multiple gemini models
- also switch on letter page


## an error

TODO: funky emoji for this

```
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro-preview-05-06:generateContent: [404 Not Found] models/gemini-2.5-pro-preview-05-06 is not found for API version v1, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.
```

```
 ERROR  Error in cover letter generation API: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-preview-04-1:generateContent: [404 Not Found] models/gemini-2.5-flash-preview-04-1 is not found for API version v1, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.
 ```

 https://www.npmjs.com/package/@google/genai

 Error in cover letter generation API: got status: 400 Bad Request. {"error":{"code":400,"message":"Content with system role is not supported.","status":"INVALID_ARGUMENT"}}

 Error in cover letter generation API: got status: 404 Not Found. {"error":{"code":404,"message":"models/gemini-2.5-flash-preview-04-1 is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.","status":"NOT_FOUND"}}

 DONE: had to use a different model and different library