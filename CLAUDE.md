# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Job Posting Analyzer is a Nuxt 3 application that helps job seekers compare their resumes against job postings using AI-powered analysis. It supports multiple LLM providers (Google Gemini, Anthropic Claude, mock service) to analyze skill matches, identify gaps, and generate tailored cover letters.

## Development Commands

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev                # Start dev server on http://localhost:3000
npm run docker:dev         # Start containerized dev server on http://localhost:3050
npm run docker:stop        # Stop all Docker containers
```

### Testing
```bash
npm test                   # Run Jest unit tests (tests/**/*.test.ts)
npm run test:e2e           # Run Playwright E2E tests (tests/playwright/**/*.spec.ts)
npm run test:e2e:headed    # Run E2E tests with UI
npm run test:e2e:ui        # Run E2E tests in interactive mode
```

### Building & Production
```bash
npm run build              # Build for production
npm run preview            # Preview production build
npm run generate           # Generate static site
npm run docker:build       # Build production Docker image
npm run docker:run         # Run production container
```

## Environment Configuration

Required environment variables (create a `.env` file):
- `GEMINI_API_KEY`: Google Gemini API key
- `ANTHROPIC_API_KEY`: Anthropic Claude API key
- `GEMINI_MODEL`: Optional, defaults to 'gemini-pro'
- `ANTHROPIC_MODEL`: Optional, defaults to 'claude-2'
- `NUXT_PUBLIC_API_BASE`: API base URL (required for production server-side calls)

Node version: **23.x** (enforced via `.nvmrc` and `.envrc` with direnv)

## Architecture

### Multi-Provider LLM Service Pattern

The app uses a **service-based architecture** with a factory pattern for AI provider switching:

1. **LLMServiceInterface** (`services/LLMServiceInterface.ts`): Base interface all providers implement
2. **Provider implementations**:
   - `GeminiLLMService.ts`: Google Gemini integration
   - `ClaudeLLMService.ts`: Anthropic Claude integration
   - `MockLLMService.ts`: Testing/development mock
3. **LLMServiceFactory.ts**: Factory for creating service instances based on user selection
4. **BaseLLMService.ts**: Shared base functionality

User's selected provider is persisted in localStorage and shared between analysis and cover letter features.

### Storage Architecture

**Hybrid storage approach** with server-first, localStorage fallback:

- **StorageService** (`services/StorageService.ts`): Primary storage abstraction
  - Server-side storage via API routes (`/api/storage`, `/api/resumes`, `/api/cover-letter-samples`)
  - Automatic fallback to browser localStorage when server unavailable
  - Handles SSR scenarios where localStorage is undefined
  - Base URL determination: checks `NUXT_PUBLIC_API_BASE`, then `window.location.origin`, then constructs from env vars

- **Server repositories** (`server/repositories/`):
  - `AnalysisRepository.ts`: Analysis history management
  - `ResumeRepository.ts`: Resume storage
  - `CoverLetterSampleRepository.ts`: Cover letter sample management
  - `ConversationRepository.ts`: Cover letter conversation history
  - All use `FileStorageService` for persistent JSON file storage

### Key Data Flow

1. **Analysis Flow**:
   - User inputs resume + job posting → `pages/analyze.vue`
   - Service selection via `ServiceSelector.vue` component
   - Analysis API call → `server/api/analyze.ts`
   - Service factory creates selected LLM provider
   - Results saved via StorageService → both server files and localStorage
   - History displayed in `AnalysisHistory.vue`

2. **Cover Letter Flow**:
   - Analysis results → `pages/cover-letter/[id].vue`
   - Optional sample letter selection (stored server-side)
   - Streaming generation via `server/api/cover-letter/generate.ts`
   - Conversation history tracked (enables regeneration with context)
   - Edit tracking with diff display

### Component Organization

Components follow atomic design in subdirectories:
- `components/input/`: Input forms (FileUpload, TextAreaInput, ResumeSelector, ServiceSelector)
- `components/analysis/`: Analysis display (AnalysisResults, AnalysisHistory, KeywordTag, SkillMatchIndicator)
- `components/admin/`: Admin tools (StorageFileViewer)
- `components/common/`: Shared utilities (ConfirmDialog)
- `components/layout/`: Layout components

### Server API Structure

```
server/
├── api/
│   ├── analyze.ts                    # Job posting analysis endpoint
│   ├── cover-letter/generate.ts      # Streaming cover letter generation
│   ├── resumes/                      # Resume CRUD operations
│   ├── storage/                      # Analysis storage + conversations
│   ├── cover-letter-samples/         # Cover letter sample management
│   └── admin/storage-files/          # Admin file operations
├── repositories/                     # Data access layer
└── services/                         # Server-side services
```

### Type System

Core types in `types/index.ts`:
- `JobPosting`, `Resume`: Input data structures
- `AnalysisResult`: Analysis output (matches, maybes, gaps, suggestions)
- `SavedAnalysis`: Persisted analysis with metadata
- `CoverLetter`: Generated cover letter with version history
- `ServiceName`: Union type for LLM providers ('mock' | 'gemini' | 'openai' | 'anthropic')

Additional types:
- `types/conversation.ts`: Cover letter conversation management
- `types/compressed-context.ts`: Context compression for LLM calls
- `types/instruction-stack.ts`: Prompt instruction management

## Git Workflow

### Commit Process

**Always follow this sequence when creating commits:**

1. Run `git status` and `git diff --staged` to understand changes
2. Review changes against criteria in `.github/changelog-management.md`
3. **Ask user**: "Should I create a changelog entry for these changes?"
   - Include entries for: API changes, UI features, user-facing bugs, breaking changes
   - Exclude: Internal refactoring, tests, build changes, LLM instructions
4. If approved, update `CHANGELOG.md` following keepachangelog.com format
5. Draft commit message following Conventional Commits
6. Stage changelog (if modified) and commit

### Commit Message Format

Use Conventional Commits:
```
feat(analysis): add skill gap recommendations
fix(storage): resolve localStorage SSR issues
docs(readme): update API setup instructions
refactor(services): simplify LLM factory pattern
test(cover-letter): add generation unit tests
```

All commits should include:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Semantic Versioning

- **MAJOR**: Breaking changes, API incompatibilities
- **MINOR**: New features, backwards-compatible additions
- **PATCH**: Bug fixes, backwards-compatible changes (default)

## Important Patterns & Conventions

### When Working with Services

- Use the factory pattern: `LLMServiceFactory.create(serviceName)`
- All services must implement `LLMServiceInterface`
- Handle provider availability checks with `isAvailable()`
- Services are stateless—create new instances per request

### Storage Service Usage

- Always use `StorageService` methods, never direct localStorage
- Expect fallback behavior—server calls may fail gracefully
- Server-side code must set `NUXT_PUBLIC_API_BASE` for API calls
- Storage limits: 10 analyses, 10 resumes (automatically trimmed)

### Component Development

- Use `<script setup lang="ts">` with Composition API
- Props: Define with types, avoid optional when possible
- Emit events with explicit type signatures
- Structure: `<script>` → `<template>` → `<style scoped>`
- Use Tailwind CSS utility classes, avoid inline styles

### API Route Implementation

- Use `defineEventHandler` for API routes
- Return proper HTTP status codes
- Handle errors with try-catch and meaningful messages
- Use repositories for data access, not direct file operations

### TypeScript Usage

- All services, components, and API routes should be typed
- Use module path alias `~/` for imports from project root
- Define new types in `types/` directory
- Avoid `any` type—use `unknown` and narrow with guards

## Docker Development

- Hot-reloading enabled in dev container (port 3050)
- Only rebuild dev image when changing `package.json`, `Dockerfile`, or `docker-compose.dev.yml`
- Production build uses multi-stage Dockerfile for optimized image
- Must rebuild production image after every code change

## Pre-commit Hooks

Husky pre-commit hooks are configured in `.husky/pre-commit`. Currently modified in working directory—check hook configuration before committing.

## File Parsing Support

Resume upload supports multiple formats via server-side parsing:
- Plain text (`.txt`)
- Markdown (`.md`)
- PDF (`.pdf`) using `pdfjs-dist`

Add new parsers in `server/api/resumes/index.ts` with appropriate MIME type handling.
