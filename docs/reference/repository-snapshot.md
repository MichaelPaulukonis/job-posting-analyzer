# Job Posting Analyzer – Repository Snapshot

---

## 1. Project Overview
**Project Name:** Job Posting Analyzer
**Purpose:** Analyze job postings and compare them to user resumes, highlighting skill matches, gaps, and providing tailored improvement suggestions. Supports cover letter generation and history tracking.
**Technology Stack:**
- Nuxt.js 3 (TypeScript, Composition API)
- Tailwind CSS
- Firebase (auth, planned for storage)
- Google Gemini, Anthropic Claude (AI integration)
- Jest, Playwright (testing)
- Docker (deployment)
**Project Type:** Web application
**Target Audience:** Job seekers, career coaches, resume writers
**Current Status:** Active development (v0.4.25), authentication recently added, cloud DB migration planned

## 2. Architecture Summary
**Overall Architecture:**
- Modular Nuxt 3 app with file-based routing
- Service-based AI integration (Gemini, Claude, Mock)
- Firebase for authentication (client/server plugins, composables)
- Planned migration to cloud database for resume/job data
**Key Components:**
- `components/` (UI, analysis, input, admin)
- `services/` (AI, Auth, Storage, Memory)
- `server/api/` (REST endpoints)
- `composables/` (state, API, auth)
- `types/` (TypeScript types)
**Data Flow:**
- User uploads resume/job posting → client-side analysis → AI service → results displayed
- Auth via Firebase; planned DB for persistent storage
**External Dependencies:**
- Google Gemini, Anthropic Claude APIs
- Firebase (auth, planned storage)
- Tailwind, Jest, Playwright
**Design Patterns:**
- Service factory for AI providers
- Composables for state/data
- Modular SFCs (atomic design)

## 3. Repository Structure Analysis
**Directory Organization:**
- `components/` (UI, subfolders by domain)
- `pages/` (Nuxt file-based routing)
- `services/` (AI, Auth, Storage abstractions)
- `server/api/` (API endpoints)
- `types/` (TypeScript types)
- `composables/` (shared logic)
- `middleware/` (route guards)
- `docs/` (documentation, plans, reference)
**Key Files/Dirs:**
- `nuxt.config.ts`, `package.json`, `Dockerfile`, `jest.config.js`, `playwright.config.ts`
- `README.md`, `CHANGELOG.md`
**Config Files:**
- `.nvmrc`, `.envrc`, `.env`, `nuxt.config.ts`, `docker-compose*.yml`
**Entry Points:**
- `app.vue`, `pages/index.vue`, `nuxt.config.ts`
**Build/Deploy:**
- Docker, Nuxt build/generate, scripts in `package.json`

## 4. Feature Analysis
**Core Features:**
- Resume/job posting analysis (AI-powered)
- Skill match/gap detection
- Cover letter generation
- Analysis history
- Authentication (Firebase)
**User Workflows:**
- Upload/paste resume/job → analyze → view results → save history → generate cover letter
**API Endpoints:**
- `server/api/` (analyze, auth, cover-letter, storage)
**Database Schema:**
- Not yet implemented; planned for cloud DB (Firebase/other)
**Authentication:**
- Firebase (client/server plugins, composables, middleware)

## 5. Development Setup
**Prerequisites:**
- Node.js 23+, nvm, direnv
- npm
**Installation:**
1. `brew install nvm direnv`
2. `direnv allow` in project dir
3. `npm install`
**Workflow:**
- Nuxt dev server, Docker for deployment
- API keys for Gemini, Anthropic, Firebase
**Testing:**
- Jest (unit), Playwright (e2e)
- Mocks for Firebase
**Code Quality:**
- ESLint, Prettier, strict TypeScript

## 6. Documentation Assessment
**README:**
- Covers setup, environment, basic usage
- Needs more on features, architecture, API, deployment
**Code Docs:**
- Some inline comments, service README
**API Docs:**
- Minimal; endpoints in `server/api/`
**Architecture Docs:**
- Some notes in `docs/`, needs expansion
**User Docs:**
- Lacking; no end-user guides

## 7. Missing Documentation Suggestions
- **PRD:** `/docs/requirements/PRD.md`
- **ADRs:** `/docs/decisions/`
- **API Docs:** `/docs/api/`
- **Deployment Guide:** `/docs/deployment/`
- **Changelog:** `CHANGELOG.md`
- **Security Policy:** `SECURITY.md`

## 8. Technical Debt and Improvements
**Code Quality:**
- Auth added late; needs refactor for consistency
- Some duplicated logic in services/composables
**Performance:**
- No major bottlenecks, but DB migration may impact
**Security:**
- Auth flows improved, but review needed for token handling, error messages
**Scalability:**
- Current local storage; cloud DB migration needed
**Dependencies:**
- Generally up-to-date; review for unused packages

## 9. Project Health Metrics
**Complexity:** Moderate (modular, but some late additions)
**Test Coverage:** Good for auth, needs more for analysis/AI
**Docs Coverage:** Partial; key gaps in API, architecture, user guides
**Maintainability:** Medium; modular, but auth/db refactor needed
**Technical Debt:** Moderate; auth integration, planned DB migration

## 10. Recommendations and Next Steps
**Critical Issues:**
- Refactor authentication for consistency
- Plan/execute cloud DB migration
- Harden security (token, error handling)
**Docs:**
- Expand README, add PRD, ADRs, API, deployment, security docs
**Code Quality:**
- Remove duplication, improve composable/service structure
**Feature Gaps:**
- User guides, DB-backed history, admin features
**Infrastructure:**
- CI/CD, monitoring, deployment docs

---

## Quick Start Guide
1. Install prerequisites: `brew install nvm direnv`
2. Allow direnv: `direnv allow`
3. Install deps: `npm install` & configure API keys

## Related Resources
- [Nuxt 3 Docs](https://nuxt.com/docs)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Anthropic Claude API](https://docs.anthropic.com/claude/docs)

## Project Roadmap (from code & docs)
- Refactor authentication
- Migrate to cloud DB
- Expand analysis features
- Add admin/history management
- Improve documentation

---

## Documentation Template Suggestions
- **README:** Project overview, setup, features, architecture, API, deployment, contributing, changelog
- **PRD:** `/docs/requirements/PRD.md` – Problem, requirements, approach, steps, risks, dependencies
- **Architecture:** `/docs/architecture/` – System diagram, components, data flow, decisions
- **API Docs:** `/docs/api/` – Endpoint list, request/response, auth, error handling

---

## Auth & DB Migration Decision
Given auth was added late and DB migration is planned, a full rewrite is not strictly required. However, a focused refactor of authentication and a clean DB integration (with proper types, error handling, and migration plan) is strongly recommended before further feature development. This will improve maintainability and scalability without losing current progress.

---

*Generated by GitHub Copilot (GPT-4.1) on 2025-11-24*
