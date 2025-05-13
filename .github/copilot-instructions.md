# GitHub Copilot Instructions for Job Posting Analyzer

## Project Context

This is a Vue.js 3 application designed to help job seekers compare their resumes against job postings. The tool analyzes job descriptions to identify skill matches, gaps, and provide tailored suggestions for improving application materials.

## Technology Stack

When suggesting code, please use:

- **Vue.js 3** with Composition API (setup(), ref(), computed(), etc.)
- **TypeScript** prefer for all code files, with proper typing
- **Tailwind CSS** for styling components
- **Vue Router** for navigation
- **Vue Reactive state** for state management
- No Vuex or Pinia required

## AI Integration Guidelines

The application supports multiple AI service providers:
- OpenAI API
- Google Gemini API
- Mock service (for testing/development)

When suggesting AI-related code:
- Use a service-based architecture with interfaces
- Allow for seamless provider switching
- Handle API errors gracefully
- Include appropriate fallback mechanisms

## Storage

The application uses client-side storage:
- Prefer the local storage service abstraction
- Create appropriate interfaces/types for stored data
- Consider data persistence patterns

## Core Features & Implementation Guidelines

### Resume Management
- Support for parsing multiple file formats (txt, md, pdf)
- Direct text input capabilities
- Resume versioning with naming

### Job Posting Analysis
- Support for pasting job descriptions or file uploads
- Implement comparison logic between resume and job requirements
- Structure for AI-powered compatibility analysis
- Display categorized results (matches, potential matches, gaps, suggestions)

### Analysis History
- Save and retrieve analysis results
- Implement history management operations

### UI Components
- Create responsive designs for all components
- Implement collapsible sections for better UX
- Include loading indicators for async operations
- Provide clear error handling and validation

## Code Style

- Use Vue 3's script setup syntax when possible
- Properly type all function parameters and return values
- Follow component composition pattern with reusable composables
- Write clear comments for complex logic
- Use semantic naming for variables and functions

Always utilize the latest JavaScript and TypeScript features in strict mode. Embrace modern practices and current design patterns. Prefer semantic HTML elements (header, nav, main, section, article, footer) over generic divs. Ensure compliance with W3C standards and WCAG 2.1 AA guidelines. For CSS, employ CSS Modules, styled-components, or TailwindCSS with responsive designs based on Flexbox/Grid. Avoid outdated approaches like floats for layout. Use single quotes and spaces for indentation in JavaScript and TypeScript code

## Patterns and Best Practices

Apply functional programming principles: immutability, pure functions, and avoiding uncontrolled side effects. For frontend state management, choose the solution that matches the complexity: useState/useReducer for local state, Context API for simple shared state, Redux Toolkit for complex state, and React Query/SWR for server data. Implement code splitting with React.lazy and dynamic imports to optimize performance. Use custom hooks to extract and reuse common logic between components. For backend APIs, consistently validate and sanitize user inputs with libraries like Zod, Yup, or Joi.

## Testing and Quality Considerations

When suggesting test-related code:
- Focus on unit testing for services and utility functions
- Component testing for key UI elements
- Mock external services appropriately

Write unit tests with Jest/Vitest for important functions and hooks. Use React Testing Library for component tests, focusing on user behavior simulation. Implement integration tests for critical workflows and use Playwright/Cypress for end-to-end testing of important user journeys. Maintain a test coverage of at least 80% for critical business logic. Security Apply OWASP Top 10 protections in all applications. Validate and sanitize all user inputs on both client and server sides. For authentication, use JWT tokens with rotation and secure storage. Apply the principle of least privilege for authorizations. Avoid exposing sensitive information in logs or error messages. Use secure practices for secret management (environment variables, secret managers). Implement CSP and other security headers to prevent XSS and CSRF attacks