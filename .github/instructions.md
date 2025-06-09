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
- No Vuex or Pinia required

## AI Integration Guidelines

The application will support multiple AI service providers with specific architecture requirements:

- OpenAI API (eventually)
- Google Gemini API
- Anthropic Claude API
- Mock service (for testing/development)

When suggesting AI-related code:

- Use a service-based architecture with interfaces
- Allow for seamless provider switching. The selected provider is shared between the analysis and cover letter generation features and this preference is persisted in `localStorage`.
- Handle API errors gracefully
- Include appropriate fallback mechanisms

## Storage

The application uses client-side storage with the following considerations:

- Prefer the local storage service abstraction
- Create appropriate interfaces/types for stored data
- Consider data persistence patterns

## Core Features & Implementation Guidelines

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

### UI Components

Create user interface components following these principles:

- Create responsive designs for all components
- Implement collapsible sections for better UX
- Include loading indicators for async operations
- Provide clear error handling and validation

## Code Style

Follow these coding style guidelines for consistency and quality:

- Use Nuxt 3's script setup syntax when possible
- Properly type all function parameters and return values
- Follow component composition pattern with reusable composables
- Write clear comments for complex logic
- Use semantic naming for variables and functions

Always utilize the latest JavaScript and TypeScript features in strict mode. Prefer semantic HTML elements over generic divs and ensure compliance with W3C standards and WCAG 2.1 AA guidelines. For CSS, use TailwindCSS with responsive designs based on Flexbox/Grid.

## Commit Message Guidelines

All commit messages should adhere to the Conventional Commits specification.
For detailed instructions, please refer to [Conventional Commits 1.0.0](./copilot-commit-message-instructions.md).

## Patterns and Best Practices

Apply functional programming principles and appropriate state management approaches:

- Use `ref()` and `reactive()` for local component state
- Leverage Nuxt's `useState()` composable for shared state across components
- Implement `provide()`/`inject()` for passing data down component trees
- Use `useAsyncData()` and `useFetch()` for server data and API interactions

Implement code splitting with Nuxt's built-in lazy-loading:

- Lazy-loaded components with `defineAsyncComponent()`
- Lazy-loaded pages with the `lazy` option in route configuration

Extract and reuse common logic with Vue composables. For backend APIs, consistently validate and sanitize user inputs with libraries like Zod, Yup, or Joi.

## Folder Structure Guidelines

Follow Nuxt 3 conventions for directory organization with these specific structures:

### Core Directories

Organize standard Nuxt directories as follows:

- **pages/**: File-based routing with each file corresponding to a route
- **components/**: Reusable Vue components
  - Use subdirectories for organization (e.g., `ui/`, `forms/`, `analysis/`)
  - Consider atomic design principles (atoms, molecules, organisms)
- **composables/**: Shared composition functions with Vue's Composition API
- **layouts/**: Page templates and layouts
- **public/**: Static assets served directly (favicon, robots.txt)
- **assets/**: Processed assets (images, fonts, global CSS)
- **middleware/**: Route middleware functions
- **server/**: Server-side code, API routes, and server middleware
- **plugins/**: Vue plugins and application extensions

### Project-Specific Directories

Add these project-specific directories for better organization:

- **types/**: TypeScript interfaces, types, and enums
- **utils/**: Helper functions and utilities
- **services/**: AI service providers and other external integrations
  - Organize with a base interface and provider-specific implementations
- **stores/**: Reactive state management composables
- **tests/**: Unit, component, and integration tests

Ensure consistent relative imports, using `~/` alias for project root. Keep related files close to where they're used when possible.

## Testing and Quality Considerations

Implement comprehensive testing with these approaches:

- Focus on unit testing for services and utility functions
- Component testing for key UI elements
- Mock external services appropriately

Write unit tests with Jest/Vitest for important functions and composables. Use @testing-library/vue for component tests, focusing on user behavior simulation. Implement integration tests for critical workflows and maintain a test coverage of at least 80% for critical business logic.

## Security

Apply OWASP Top 10 protections in all application components:

- Validate and sanitize all user inputs on both client and server sides
- For authentication, use JWT tokens with rotation and secure storage
- Apply the principle of least privilege for authorizations
- Avoid exposing sensitive information in logs or error messages
- Use secure practices for secret management (environment variables, secret managers)
- Implement CSP and other security headers to prevent XSS and CSRF attacks