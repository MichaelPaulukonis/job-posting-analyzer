# Cover Letter Generation Feature

## Overview

The Cover Letter Generation feature assists users in creating tailored cover letters based on their resume and a specific job description. It leverages AI services to analyze the input documents and generate a draft cover letter that highlights relevant skills and experiences, aligning them with the job requirements.

## ✨ New: Conversation Context

**Smart iterative refinement with memory!** The system now maintains conversation history during cover letter refinement, ensuring your feedback and preferences are preserved across multiple regeneration cycles.

- **Context Preservation**: Never lose your previous instructions again
- **Cumulative Improvements**: Each refinement builds on all previous feedback  
- **Conversation History**: See your entire refinement journey in the sidebar
- **Persistent Memory**: Conversations saved across browser sessions

[📖 Learn more about Conversation Context](./conversation-context-user-guide.md)  
[🔧 Technical Implementation Details](./conversation-context.md)

## Core Functionality

- **Select Analysis**: Users choose from previously saved job analyses to use as context for the cover letter.
- **Sample-Based Generation**: Users can select from predefined cover letter samples/templates to guide the generation process.
- **AI-Powered Generation**: Utilizes selected AI services (OpenAI, Gemini, Claude, or Mock) to generate a cover letter.
- **Review and Edit**: Users can review the generated cover letter, make manual edits, and regenerate with new instructions.
- **Iterative Refinement**: Provide feedback and instructions that build on previous generations with full context preservation.
- **Save and Manage**: Version and edits are saved. Eventually there will a way to view different versions of generated cover letters.

## Component Architecture

### Client-Side Components

1.  **Cover Letter Page (`/pages/cover-letter/index.vue`)**:
    *   Main container for the cover letter generation interface.
    *   Handles input for job description and resume selection.
    *   Manages selection of AI service and cover letter samples.
    *   Displays the generated cover letter.
    *   Imports and uses `TextAreaInput`, `ResumeSelector`, `ServiceSelector`, `CoverLetterSampleSelector`.

2.  **Cover Letter Sample Selector (`/components/input/CoverLetterSampleSelector.vue`)**:
    *   Allows users to choose a predefined sample or style for the cover letter.
    *   Fetches available samples via an API call.

3.  **Cover Letter Sample Dialog (`/components/input/CoverLetterSampleDialog.vue`)**:
    *   Displays the content of a selected cover letter sample.

4.  **Conversation History (`/components/analysis/ConversationHistory.vue`)**:
    *   **NEW**: Displays the conversation flow between user and AI during refinement
    *   Shows chronological message history with role indicators
    *   Expandable/collapsible interface for long conversations
    *   Timestamps and metadata for each interaction

### Server-Side API Endpoints

1.  **Generate Cover Letter (`/server/api/cover-letter/generate.ts`)**:
    *   **ENHANCED**: Now supports conversation context for iterative refinement
    *   Accepts job description, resume content, selected AI service, optional sample ID, and conversation ID
    *   Maintains conversation history across multiple generations
    *   Orchestrates the call to the appropriate AI LLM service via `LLMServiceFactory`
    *   Returns the generated cover letter text and updated conversation context

2.  **Conversation Storage (`/server/api/storage/conversations.ts`)**:
    *   **NEW**: Handles persistence of conversation history
    *   GET: Retrieve all conversations for an analysis
    *   POST: Save conversation data with validation
    *   Provides fallback to localStorage for client-side storage

3.  **List Cover Letter Samples (`/server/api/cover-letter-samples/index.ts`)**:
    *   Returns a list of available cover letter samples/templates.
    *   Uses `CoverLetterSampleRepository` to fetch sample metadata.

4.  **Get Cover Letter Sample Content (`/server/api/cover-letter-samples/[id].ts`)**:
    *   Dynamic route that accepts a sample ID.
    *   Uses `CoverLetterSampleRepository` to fetch the content of a specific sample.

## Data Flow

1.  User navigates to the Cover Letter page.
2.  User selects an existing job analysis
3.  User selects an AI service and optionally a cover letter sample.
4.  The client makes a POST request to `/api/cover-letter/generate` with the job description, resume, service choice, and sample ID.
5.  The `generate.ts` endpoint uses `LLMServiceFactory` to get an instance of the chosen AI service (e.g., `OpenAIService`, `GeminiService`).
6.  The selected AI service processes the inputs (and potentially sample content) and generates the cover letter.
7.  The server responds with the generated cover letter text.
8.  The client displays the cover letter to the user for review and editing.

## AI Integration

-   The feature integrates with multiple AI LLM services (OpenAI, Google Gemini, Anthropic Claude) through a common `LLMServiceInterface`.
-   `LLMServiceFactory` is responsible for instantiating the correct service based on user selection.
-   Each AI service (`OpenAIService`, `GeminiLLMService`, `ClaudeLLMService`) implements the logic for interacting with its specific API, including prompt engineering tailored for cover letter generation.
-   A `MockLLMService` is available for development and testing, providing placeholder responses.
-   Prompts are designed to guide the AI in producing relevant, coherent, and professionally toned cover letters. (See `notes/cover-letters/prompts.cover.letter.notes.md` for more details on prompt strategies).

## Storage

-   Generated cover letters are persistently stored with their associated resume/job description
-   Changes to the cover letter are also stored, but no mechanisms are currently in place to manage different versions.
-   Cover letter samples are stored server-side and managed by `CoverLetterSampleRepository`.

## Future Enhancements

1.  **Manage Cover Letters**: Allow users to manage different versions.
  1.  Probably not a priority, for specific job applications, users will likely just want to generate a new cover letter.
2.  **Advanced Editing Tools**: Integrate a rich text editor for more sophisticated formatting of the cover letter.
  1.  This could be useful, but is not a priority.
3.  **Tone and Style Adjustment**: Provide options to adjust the tone (e.g., formal, enthusiastic) and style of the generated cover letter.
  1.  Which is implicit in the regeneration process, but could be made explicit with user controls.
4.  **Feedback Mechanism**: Allow users to rate the quality of the generated cover letter to help improve the underlying prompts and models.
  1.  Well, this is a bit of a stretch, but could be useful for future iterations.
6.  **Export Options**: Allow users to download the cover letter in various formats (e.g., PDF, DOCX).
  1.  Of limited utility, as formatting is required.

