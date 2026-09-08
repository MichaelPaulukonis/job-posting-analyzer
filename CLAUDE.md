# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Does

A Nuxt 3 web application that compares resumes against job postings, identifies skill matches/gaps, and generates tailored cover letters. Supports multiple AI providers (Google Gemini, Anthropic Claude, OpenAI) via a factory pattern.

## Commands

```bash
# Development
npm run dev              # Start dev server (uses .env.local)
npm run dev:rds          # Dev server connecting to AWS RDS
npm run dev:full         # Full local dev (app + database in Docker)

# Testing
npm run test             # Run unit tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests (run sequentially; requires test DB)
npm run test:all         # All tests (unit + integration)
npm run test:e2e         # E2E tests (Playwright)
npm run test:e2e:headed  # E2E with visible browser

# Run a single test file
npx jest tests/path/to/test.test.ts
npx jest --testNamePattern="test name pattern"

# Database (local)
npm run test:db:up       # Start test DB on port 5433 (required for integration tests)
npm run test:db:down     # Stop test DB
npm run db:local:up      # Start local dev DB on port 5434
npm run db:local:setup   # Initialize local DB schema

# Database (AWS RDS)
npm run db:rds:start     # Start RDS instance
npm run db:rds:status    # Check RDS status
npm run db:sync:from-rds # Pull RDS data to local

# Prisma
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <description>  # Create and apply migration
```

## Architecture

### Layer Overview

```
Browser (Vue 3 / Nuxt 3)
  └─ Pages + Components
  └─ Composables (shared reactive state)
  └─ StorageService (PostgreSQL via API, localStorage fallback)

Nuxt Nitro Server
  └─ /server/api/*       – REST endpoints
  └─ /server/repositories/  – DB access (Prisma)
  └─ /server/middleware/verifyToken.ts  – Firebase JWT auth
  └─ /server/utils/prisma.ts  – Prisma singleton

Database
  └─ PostgreSQL + pgvector (1536-dim embeddings)
  └─ Prisma ORM (schema: prisma/schema.prisma)
```

### Key Data Flow

1. User submits resume + job posting URL/text
2. `/api/analyze` calls `LLMServiceFactory` → selected AI provider
3. AI returns structured analysis (matches, gaps, suggestions, similarity score)
4. Results persisted to PostgreSQL via repositories; cached in localStorage
5. Cover letter generation at `/api/cover-letter/generate` uses conversation context from `ConversationRepository`

### AI Service Architecture

All AI providers implement `LLMServiceInterface`. `LLMServiceFactory` selects provider based on env config. `MockLLMService` is used in tests. Adding a provider = implement the interface + register in factory. The user's selected provider is shared between the analysis and cover-letter generation features and persisted in `localStorage`.

### Auth Flow

- Client: Firebase SDK for login/signup
- Server: `verifyToken.ts` middleware validates Firebase JWT on protected routes
- Dev bypass: `NUXT_PUBLIC_AUTH_DISABLED=true` skips auth checks

### Storage Hybrid Pattern

`StorageService` (`/services/StorageService.ts`) attempts PostgreSQL first via API calls; falls back to browser localStorage. This allows offline/unauthenticated usage. The app is transitioning from JSON-file storage (`.data/`) to PostgreSQL. Legacy JSON files: `resumes.json`, `analysis-history.json`, `conversations.json`, `cover-letter-samples.json`.

## SFC Structure Convention

Vue single-file components must follow this order: `<script setup lang="ts">` → `<template>` → `<style lang="scss" scoped>`.

## Coding Standards

- Formatting (Prettier): single quotes, semicolons required, 2-space indent, 100-char line limit, no trailing commas.
- Prefer semantic HTML elements over generic divs; comply with WCAG 2.1 AA.

## Debugging Patterns

- Server-side API errors: log request details (endpoint, params), the error, and the full response.
- Client-side: validate server responses are the expected shape (e.g. array) before using array methods; fall back to cached data on invalid/unexpected data.
- File storage issues: log read attempts, raw data length, parsed data type, and any parse errors.

## Testing Standards

Target ≥80% test coverage for critical business logic (services, utils). Component tests use `@testing-library/vue`, focused on user behavior over implementation detail.

## Database Environments

| Environment | Port | Database |
|-------------|------|----------|
| Test (tmpfs) | 5433 | jobanalyzer_test |
| Local Dev   | 5434 | jobanalyzer |
| AWS RDS     | 5432 | jobanalyzer |

Integration tests require `npm run test:db:up` to be running first.

## Required Environment Variables

Copy `.env.example` → `.env.local`. Key vars:

- `DATABASE_URL` – Prisma connection string
- `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` – AI providers
- `FIREBASE_SERVICE_ACCOUNT` – Server-side Firebase Admin
- `NUXT_PUBLIC_FIREBASE_*` – Client-side Firebase config
- `NUXT_PUBLIC_AUTH_DISABLED=true` – Disable auth for local dev

## Mandatory Planning Process

All new feature development must have a Taskmaster task. Two valid entry paths:

- **Plan-file → TM task**: Create `docs/plans/NN.semantic-name.md` (increment from current highest number), then parse it into Taskmaster via `mcp__task-master-ai__parse_prd` with `--append`.
- **TM task directly**: Start from an existing Taskmaster task — no plan file required.

When creating a plan file, required sections: Problem Statement, Requirements, Technical Approach, Implementation Steps, Testing Strategy, Risks & Mitigation, Dependencies. Completed plans are moved to `docs/plans/completed/` and annotated.

Exceptions (no plan file or TM task required): documentation updates, single-line bug fixes.

ADRs for significant architectural decisions go in `docs/adr/` using the template at `docs/adr/TEMPLATE.md`.

## Git Commit Workflow

**Never commit autonomously.** Follow this sequence every time:

1. Review changes with `git status` and `git diff --staged`.
2. Evaluate against `.github/changelog-management.md` — ask the user: "Should I create a changelog entry for these changes?"
3. If yes, update `CHANGELOG.md` (keepachangelog.com format; default to PATCH bump, ask user to confirm MINOR/MAJOR).
4. Draft a Conventional Commits message (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, etc.) and **stop — wait for explicit user approval**.
5. Only commit after the user explicitly approves the message and confirms they've tested the changes.

## Task Master Integration

This repo uses Task Master AI (see `.taskmaster/CLAUDE.md`) for structured task management via MCP. Use `mcp__task-master-ai__get_tasks` to see current tasks, `mcp__task-master-ai__next_task` to get the next actionable item.

## Naming Conventions

- Components: PascalCase
- Files/folders: kebab-case
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Path alias `~/` maps to project root


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
