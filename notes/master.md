# Job Posting Analyzer - Master Document

## Project Overview

The Job Posting Analyzer is a web application designed to help job seekers improve their job application process. It analyzes job descriptions against a user's resume to identify matches, gaps, and provide tailored suggestions for improving application materials.

The tool provides a structured way to:
- Compare resume content against job requirements
- Identify skill gaps and strengths
- Save analyses for future reference
- Maintain multiple resume versions
- Generate recommendations for resume improvements
- Tailor a cover letter based on job requirements
- Integrate with multiple AI services for analysis and suggestions

## Technology Stack

- **Frontend Framework**: Vue.js 3 (Composition API)
- **Type System**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: Vue Router
- **State Management**: Vue Reactive state
- **AI Integration**: Multiple service options
  - OpenAI
  - Google Gemini
  - Anthropic Claude
  - Mock service (for testing/development)
- **Storage**: Client-side storage using local storage service

## Core Features

### Resume Management
- Upload resume files (txt, md, pdf formats)
- Paste resume content directly
- Save and name multiple resume versions
- Select from previously saved resumes

### Job Posting Analysis
- Input job descriptions by pasting or file upload
- Compare resume against job requirements
- AI-powered analysis of compatibility
- View categorized results:
  - Skills matches
  - Potential matches
  - Skill gaps
  - Improvement suggestions

### Analysis History
- Save analysis results with job titles
- View history of previous analyses
- Reload saved analyses
- Delete individual analyses or clear history

### Service Options
- Select from multiple AI providers for analysis and cover letter generation
- User's preferred provider is saved and reused
- Fallback to mock service if APIs are unavailable
- Configurable analysis settings

### User Interface
- Responsive design for different screen sizes
- Collapsible input sections
- Clear error handling and validation
- Loading indicators for analysis in progress

## Versioning

This project uses an automated versioning system with a `pre-commit` hook managed by **Husky**.

When a commit is made to the `main` branch, the `pre-commit` hook automatically increments the patch version number in `package.json`. This ensures that every commit to `main` is associated with a unique version, which is then displayed in the admin panel.
