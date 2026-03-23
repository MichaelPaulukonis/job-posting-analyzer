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

All AI providers implement `LLMServiceInterface`. `LLMServiceFactory` selects provider based on env config. `MockLLMService` is used in tests. Adding a provider = implement the interface + register in factory.

### Auth Flow

- Client: Firebase SDK for login/signup
- Server: `verifyToken.ts` middleware validates Firebase JWT on protected routes
- Dev bypass: `NUXT_PUBLIC_AUTH_DISABLED=true` skips auth checks

### Storage Hybrid Pattern

`StorageService` (`/services/StorageService.ts`) attempts PostgreSQL first via API calls; falls back to browser localStorage. This allows offline/unauthenticated usage. The app is transitioning from JSON-file storage (`.data/`) to PostgreSQL.

## SFC Structure Convention

Vue single-file components must follow this order: `<script setup lang="ts">` → `<template>` → `<style lang="scss" scoped>`.

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
