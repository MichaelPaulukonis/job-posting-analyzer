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

4. Use async/await over promises for asynchronous operations.

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

6. Always utilize the latest JavaScript and TypeScript features in strict mode. Prefer semantic HTML elements over generic divs and ensure compliance with W3C standards and WCAG 2.1 AA guidelines.

## 3. Prettier Formatter Configuration

1. Semicolons: Always end statements with a semicolon (;) to improve clarity and prevent potential issues caused by automatic semicolon insertion.
2. Indentation: Use 2 spaces per indentation level to ensure clean and concise code formatting.
3. Quotations: Use single quotes (') for strings instead of double quotes, except in cases where escaping single quotes would make the string less readable.
4. Line Length: Limit each line of code to a maximum of 100 characters. Break long lines logically to improve readability while adhering to this limit.
5. Trailing Commas: Avoid trailing commas in object and array literals, function arguments, and other contexts where they might appear.

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

2. Use Cypress for end-to-end testing.

3. Test edge cases for data fetching, state management, and API integration.

4. Leverage Nuxt DevTools for debugging and performance monitoring.

5. Focus on unit testing for services and utility functions.

6. Component testing for key UI elements using @testing-library/vue, focusing on user behavior simulation.

7. Mock external services appropriately.

8. Implement integration tests for critical workflows and maintain a test coverage of at least 80% for critical business logic.

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

2. Maintain a README.md file with:
   - Project setup instructions
   - Dependencies
   - Code structure overview
   - Deployment guidelines

3. Keep the codebase self-documenting by using clear variable and function names.

4. Write clear comments for complex logic.

5. Use semantic naming for variables and functions.

## 15. Commit Message Guidelines

All commit messages should adhere to the Conventional Commits specification.
For detailed instructions, please refer to [Conventional Commits 1.0.0](./copilot-commit-message-instructions.md).

## 16. Deployment

1. Use Static Site Generation (SSG) for projects that don't require dynamic content.

2. For dynamic projects, prefer server-side rendering (SSR) with edge or server hosting.

3. Set up CI/CD pipelines to automate build, testing, and deployment processes.

4. Monitor deployments and runtime performance using tools like Vercel, Netlify, or custom monitoring solutions.

By following these guidelines, we can ensure that this Nuxt 3 job posting analyzer project remains efficient, scalable, and maintainable, while providing clear context for AI assistance in development tasks.
