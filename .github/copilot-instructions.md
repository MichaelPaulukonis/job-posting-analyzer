---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

# GitHub Copilot Instructions for Job Posting Analyzer

## Project Context

This is a Nuxt.js 3 application designed to help job seekers compare their resumes against job postings. The tool analyzes job descriptions to identify skill matches, gaps, and provide tailored suggestions for improving application materials.

## Technology Stack

When suggesting code, please use the following technologies:

- **Nuxt.js 3** with Composition API (setup(), ref(), computed(), etc.)
- **TypeScript** prefer for all code files, with proper typing
- **Tailwind CSS** for styling components
- **Nuxt Router** for navigation
- **Nuxt Reactive state** for state management
- No Vuex or Pinia required - use Nuxt's built-in composables only
- **PostgreSQL** with `pgvector` extension (when using AWS RDS)
- **AWS SDK for JavaScript** (when migrating to AWS)

## 1. Project Structure

1. Follow the default Nuxt 3 project structure for better readability and framework alignment:
   - **pages/**: File-based routing with each file corresponding to a route
   - **components/**: Reusable Vue components
     - Use subdirectories for organization (e.g., `input/`, `analysis/`, `admin/`)
     - Consider atomic design principles (atoms, molecules, organisms)
   - **composables/**: Shared composition functions with Vue's Composition API
   - **layouts/**: Page templates and layouts
   - **server/**: Server-side code, API routes, and server middleware
   - **plugins/**: Vue plugins and application extensions
   - **middleware/**: Route middleware functions
   - **assets/**: Processed assets (images, fonts, global CSS)
   - **public/**: Static assets served directly (favicon, robots.txt)

2. Project-specific directories for better organization:
   - **types/**: TypeScript interfaces, types, and enums
   - **utils/**: Helper functions and utilities
   - **services/**: AI service providers and other external integrations
     - Organize with a base interface and provider-specific implementations
   - **tests/**: Unit, component, and integration tests
   - **`docs/`**: Project documentation, including overviews and plans.


3. Maintain clear folder hierarchies and avoid deeply nested structures unless absolutely necessary.
4. Ensure consistent relative imports, using `~/` alias for project root. Keep related files close to where they're used when possible.

## 2. Coding Standards

1. Use ESLint for enforcing JavaScript/TypeScript code standards and Prettier for consistent formatting.

2. Prefer TypeScript for type safety and maintainability. Define types in a types/ directory.

3. Follow a consistent naming convention:
   - Components: PascalCase
   - Files and folders: kebab-case
   - Variables and functions: camelCase
   - Constants: UPPER_SNAKE_CASE

4. Use async/await over promises for asynchronous operations, except when needed for parallelization, succinctness, or when composing asynchronous behaviors in pipelines.

5. Structure of Single-File Components (SFCs): Always follow this structure for consistency and readability:
   1. Script Section: Place the `<script setup>` block at the top of the file, with `lang="ts"` if using TypeScript.
   2. Template Section: The `<template>` block should follow the script section and contain the component's HTML structure.
   3. Style Section: Add the `<style>` block at the bottom of the file, using `lang="scss"` for SCSS and `scoped` for styles scoped to the component.

   Example:
   ```vue
   <script setup lang="ts">
   // Component logic here
   </script>

   <template>
     <div class="component-wrapper">
       <!-- Template content -->
     </div>
   </template>

   <style lang="scss" scoped>
   .component-wrapper {
     // Scoped styles here
   }
   </style>
   ```

6. Always use the latest JavaScript and TypeScript features in strict mode. Prefer semantic HTML elements over generic divs and ensure compliance with W3C standards and WCAG 2.1 AA guidelines.

###. Prettier Formatter Configuration

1. Semicolons: Always end statements with a semicolon (;) to improve clarity and prevent potential issues caused by automatic semicolon insertion.
2. Indentation: Use 2 spaces per indentation level to ensure clean and concise code formatting.
3. Quotations: Use single quotes (') for strings instead of double quotes, except in cases where escaping single quotes would make the string less readable.
4. Line Length: Limit each line of code to a maximum of 100 characters. Break long lines logically to improve readability while adhering to this limit.
5. Trailing Commas: Avoid trailing commas in object and array literals, function arguments, and other contexts where they might appear.

## 3. Mandatory Planning Process

**CRITICAL**: All development work must follow this planning process before any code implementation.

### Plan-File Requirement

1.  **Before Any Code Changes**: ALL feature requests, architectural changes, or significant modifications must begin with creating—or reusing—an appropriate plan-file in `docs/plans/`.
2.  **User Confirmation Protocol**: When a user requests changes, first inspect `docs/plans/` for a relevant file. If one exists, ask the user to update it, create a new one, or proceed without one. If none exists, ask the user to create one or proceed without one. Honor the user's choice.
3.  **Plan-File Naming Convention**: `NN.semantic-name.md` (e.g., `01.user-comments.md`).
4.  **Required Plan Contents**: Problem Statement, Requirements, Technical Approach, Implementation Steps, Testing Strategy, Risks & Mitigation, Dependencies.
4.1 **Use Taskmaster MCP**: Unless directed otherwise, use taskmaster MCP server to parse the plan file (as prd) to create discrete tasks
4.2 **Taskmaster append**: Taskmaster should append new tasks, and not delete existing tasks.
4.3 **Taskmaster generate*:: Use `taskmaster generate` to generate individual task files from tasks.json
5. **Completed Plans**: When all tasks in a plan have been completed the file will be internally annotated and moved to `docs/plans/completed/`.
5.  **Exceptions**: This process is not required for Product Requirement Document creation, documentation updates or minor, single-line bug fixes.

## 4. Nuxt-Specific Best Practices

1. Use the `defineNuxtConfig` function to configure the project in `nuxt.config.ts`.

2. Leverage auto-imported features:
   - Use `defineComponent` for defining components when needed
   - Use `useState`, `useFetch`, `useLazyFetch`, and other Nuxt composables for state and data fetching
   - Use `useRuntimeConfig` for managing environment variables securely

3. Utilize the server directory for server-side logic and APIs:
   - Define API endpoints in `server/api/`
   - Use `server/middleware/` for custom server-side middleware

4. Optimize for SEO using `useHead` for meta tags and `definePageMeta` for page-level metadata.

5. State management approaches:
   - Use `ref()` and `reactive()` for local component state
   - Leverage Nuxt's `useState()` composable for shared state across components
   - Implement `provide()`/`inject()` for passing data down component trees
   - Use `useAsyncData()` and `useFetch()` for server data and API interactions

## 5. Component Development

1. Break down the UI into reusable, modular components.

2. Use props and emits sparingly, ensuring that data flow is predictable and documented.

3. Define props with types and default values to ensure reliability:
   ```typescript
   const props = defineProps<{
     title: string;
     count?: number;
     isActive?: boolean;
   }>();
   ```

4. Emit events with clear names, such as `onClick` or `onSubmit`:
   ```typescript
   const emit = defineEmits<{
     (e: 'change', id: number): void;
     (e: 'update', value: string): void;
     (e: 'submit', data: FormData): void;
   }>();
   ```

5. Create user interface components following these principles:
   - Create responsive designs for all components using Tailwind CSS
   - Implement collapsible sections for better UX
   - Include loading indicators for async operations
   - Provide clear error handling and validation

## 6. AI Integration Guidelines

The application supports multiple AI service providers with specific architecture requirements:

- OpenAI API (eventually)
- Google Gemini API
- Anthropic Claude API
- Mock service (for testing/development)

When suggesting AI-related code:

1. Use a service-based architecture with interfaces
2. Allow for seamless provider switching. The selected provider is shared between the analysis and cover letter generation features and this preference is persisted in `localStorage`.
3. Handle API errors gracefully
4. Include appropriate fallback mechanisms
5. Consistently validate and sanitize user inputs with libraries like Zod, Yup, or Joi

## 7. Core Features & Implementation Guidelines

### Resume Management
Support resume handling with the following capabilities:
- Support for parsing multiple file formats (txt, md, pdf)
- Direct text input capabilities
- Resume versioning with naming

### Job Posting Analysis
Implement job posting analysis with these features:
- Support for pasting job descriptions or file uploads
- Implement comparison logic between resume and job requirements
- Structure for AI-powered compatibility analysis
- Display categorized results (matches, potential matches, gaps, suggestions)

### Analysis History
Include history features to track user analysis:
- Save and retrieve analysis results
- Implement history management operations

## 8. Storage

The application uses client-side storage with the following considerations:

- Prefer the local storage service abstraction
- Create appropriate interfaces/types for stored data
- Consider data persistence patterns
- Ensure consistent relative imports, using `~/` alias for project root

## 9. API Integration

1. Use `useFetch` for fetching data from APIs, preferring `useLazyFetch` for on-demand loading.

2. Handle errors gracefully:
   ```typescript
   const { data, error } = await useFetch('/api/example');
   if (error.value) {
     console.error('Error fetching data:', error.value);
   }
   ```

3. Structure API endpoints semantically within the `server/api` directory.

## 10. Styling

1. Use Tailwind CSS for styling. Maintain styles in the `assets/` or `components/` directory.

2. Adhere to the BEM naming convention for class names when using custom CSS:
   - `.block__element--modifier`

3. Avoid inline styles; prefer utility classes or scoped styles.

4. Scope component-specific styles:
   ```vue
   <style lang="scss" scoped>
   .example {
     color: theme('colors.blue.600');
   }
   </style>
   ```

5. Use TailwindCSS with responsive designs based on Flexbox/Grid.

## 11. Performance Optimization

1. Optimize page load time:
   - Use `defineNuxtComponent` to lazy-load components where applicable
   - Utilize `useLazyFetch` and `asyncData` for efficient data fetching
   - Use image module for optimized images

2. Implement code splitting with Nuxt's built-in lazy-loading:
   - Lazy-loaded components with `defineAsyncComponent()`
   - Lazy-loaded pages with the `lazy` option in route configuration

3. Split code intelligently to reduce bundle size.

4. Cache frequently used data in state or cookies.

5. Extract and reuse common logic with Vue composables.

## 12. Testing and Quality Considerations

1. Write unit tests using Jest or Vitest for components and composables.

2. Use Playwright for end-to-end testing.

3. Test edge cases for data fetching, state management, and API integration.

4. Leverage Nuxt DevTools for debugging and performance monitoring.

5. Focus on unit testing for services and utility functions.

6. Component testing for key UI elements using @testing-library/vue, focusing on user behavior simulation.

7. Mock external services appropriately.

8. Implement integration tests for critical workflows and maintain a test coverage of at least 80% for critical business logic.

9. Separate tests from code, and place tests into `tests\` folder. This can be subdivided for Playwright and other strategies.

## 13. Security

Apply OWASP Top 10 protections in all application components:

1. Validate and sanitize all user inputs on both client and server sides
2. For authentication, use JWT tokens with rotation and secure storage
3. Apply the principle of least privilege for authorizations
4. Avoid exposing sensitive information in logs or error messages
5. Use secure practices for secret management (environment variables, secret managers)
6. Implement CSP and other security headers to prevent XSS and CSRF attacks

## 14. Documentation

1. Document critical components, composables, and APIs using JSDoc.
2.  **Architecture Documentation**: Maintain high-level architecture documents in the `/docs` directory.
3.  **Plan Files**: All major changes must be documented in a plan file in `docs/plans/` as per the planning process.
4. Maintain a README.md file with:
   - Project setup instructions
   - Dependencies
   - Code structure overview
   - Deployment guidelines
5. Keep the codebase self-documenting by using semantic naming for variables and functions.
6. Write clear comments for complex logic.

## 15. Git Commits 

### **Mandatory Git Commit Workflow**

When you are asked to create a commit, you **MUST** follow these steps in order:

1.  **Analyze Changes:** Run `git status` and `git diff --staged` to understand the modifications (unless `status` output provided by user)
2.  **Evaluate for Changelog:** Review the changes against the criteria in `.github/changelog-management.md`.
3.  **Ask About Changelog:** If the changes meet the criteria (e.g., new features, UI changes, bug fixes), you **MUST** ask the user: "Should I create a changelog entry for these changes?" You may also provide advice on whether an entry seems warranted (e.g., "This is a minor fix, so you may choose to skip it to avoid cluttering the changelog.").
4.  **Create Changelog (if approved):** If the user agrees, update `CHANGELOG.md` according to the project's format guidelines.
5.  **Propose Commit Message:** After handling the changelog, draft a commit message that follows the Conventional Commits specification. **STOP HERE and wait for explicit user approval.**
6.  **Wait for Manual Approval:** You **MUST** wait for the user to explicitly approve the commit message and confirm they have tested the changes. **DO NOT proceed to commit without this explicit approval.** The user may need to manually test, review, or modify the code before committing.
7.  **Commit Changes (only after approval):** **ONLY AFTER** the user has given explicit approval, stage the `CHANGELOG.md` file (if modified) and run `git commit` with the approved message. **NEVER commit autonomously.**

### See `./changelog-management.md` for detailed instructions on pre-commit changelog rules.

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

-   `feat(boards): add board archiving functionality`
-   `fix(cards): resolve drag-and-drop position calculation`
-   `docs(auth): update firebase authentication guide`
-   `refactor(service): simplify card reordering logic`
-   `test(components): add tests for BoardCard component`

When creating commit messages related to the CoverLetterService, ensure that the message accurately reflects the changes made, particularly when addressing issues with conversation context or data handling. For example:

-   `fix(service): ensure conversation context is passed for regeneration`

## 16. Deployment

1. Use Static Site Generation (SSG) for projects that don't require dynamic content.
2. For dynamic projects, prefer server-side rendering (SSR) with edge or server hosting.
3. Set up CI/CD pipelines to automate build, testing, and deployment processes.
4. Monitor deployments and runtime performance using tools like Vercel, Netlify, or custom monitoring solutions.
5. **AWS App Runner** is a recommended hosting platform when migrating to AWS.

## 17. Debugging

1.  When encountering errors, especially those originating from server-side API endpoints, ensure that comprehensive logging is implemented on the server. This includes logging:
    *   Request details (e.g., endpoint, parameters)
    *   Any errors that occur during processing
    *   The complete server response

2. Client-side code should validate that server responses are in the expected format (e.g., arrays) before using array methods. Implement fallback mechanisms, such as using cached data, when the server returns invalid or unexpected data.
   
3. When debugging file storage issues, check the following:
    * Log when the application reads from the storage file.
    * Log the raw data length.
    * Log the parsed data type and whether it is an array.
    * If the parsed data is not an array, log an error and return an empty array as a fallback.
    * Log any errors that occur while reading the file, including the error type, message, and stack trace.

## 18. AWS Migration Guidelines (Conditional)

These guidelines apply *only if* the project migrates from Firebase to AWS.

1.  **Hosting:** Use **AWS App Runner** for hosting the Nuxt 3 application. It automatically handles Docker containerization from Git and provides auto-scaling.
2.  **Database:** Use **Amazon RDS PostgreSQL** with the `pgvector` extension for storing job postings, resumes, and vector embeddings. This enables semantic similarity search.
3.  **Storage:** Use **Amazon S3** for storing resume PDFs and file uploads.
4.  **Authentication:** Consider a hybrid approach, keeping **Firebase Authentication** for simplicity while using AWS for storage and database. Alternatively, migrate to **AWS Cognito**.
5.  **Vector Search & AI:** Use **AWS Bedrock** for generating embeddings and store them in RDS with `pgvector` for semantic search.

When suggesting code related to AWS services, use the **AWS SDK for JavaScript**.

## 19. Architecture Decision Records (ADR)

1.  Create ADR files to document significant architectural decisions. Store these files in the `docs/adr/` directory.
2.  While a formal template isn't yet defined, strive to include the following sections in each ADR:
    *   **Title**: A concise title summarizing the decision.
    *   **Context**: The problem being addressed and the background information.
    *   **Decision**: The architectural decision made.
    *   **Consequences**: The positive and negative consequences of the decision.
    *   **Status**: The current status of the decision (e.g., proposed, accepted, implemented).