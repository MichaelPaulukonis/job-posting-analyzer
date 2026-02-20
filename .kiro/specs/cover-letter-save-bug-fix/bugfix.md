# Bugfix Requirements Document

## Introduction

Cover letters generated through the application are not being persisted to the PostgreSQL database as dedicated records. When users click the "Save" button, nothing visible happens - no errors, no success messages, no network activity, and no database record is created.

**Verified Database State:**
- `cover_letters` table: 0 records (confirmed empty via direct database query)
- `conversations` table: 21 records (conversations ARE being saved to database)
- Conversations contain cover letter content in their messages JSON field
- Admin page correctly queries the database via Prisma (no bug in admin interface)

**Verified Behavior:**
- The `StorageService.saveCoverLetter()` method only updates localStorage
- No API endpoint exists for saving cover letters to the database
- Conversations are saved to database via `/api/storage/conversations` endpoint
- Cover letters exist only in conversation history, not as dedicated records

**The Core Issue:**
The Save button should create a dedicated `cover_letter` record in the database (separate from conversation history), but currently does nothing. The `cover_letters` table schema exists and is ready, but no code path creates records in it. This prevents cover letters from being accessible independently of conversations, viewable in the admin interface, or queryable by resume/job posting relationships.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks the "Save" button for a cover letter THEN the system provides no visible feedback (no errors, no success messages, no network activity, no database record created)

1.2 WHEN the `StorageService.saveCoverLetter()` method is called THEN it only updates localStorage and does not make any API call to save to the database

1.3 WHEN viewing the admin page or querying the `cover_letters` table directly THEN the table is empty (0 records) despite cover letters being generated

1.4 WHEN a cover letter is generated THEN it is only accessible through conversation history in the `conversations` table, not as a dedicated record in the `cover_letters` table

1.5 WHEN no API endpoint exists for saving cover letters THEN there is no code path to create records in the `cover_letters` table

### Expected Behavior (Correct)

2.1 WHEN a user clicks the "Save" button for a cover letter THEN the system SHALL provide clear visual feedback (loading state, then success or error message)

2.2 WHEN the `StorageService.saveCoverLetter()` method is called THEN it SHALL make an HTTP request to a new API endpoint (e.g., `/api/storage/cover-letters`) that persists the cover letter to the database

2.3 WHEN the API endpoint receives a cover letter save request THEN it SHALL create a record in the `cover_letters` table with proper relationships to `resumes`, `job_postings`, and `analysis_results`

2.4 WHEN viewing the admin page or querying the `cover_letters` table THEN it SHALL contain all saved cover letters as dedicated records

2.5 WHEN a cover letter is saved successfully to the database THEN it SHALL be accessible independently of conversation history, allowing queries by resume, job posting, or analysis result

2.6 WHEN the database save operation fails THEN the system SHALL display an error message to the user (localStorage fallback is optional, not required)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN conversations are saved during cover letter generation THEN the system SHALL CONTINUE TO save them to the database via `/api/storage/conversations` endpoint

3.2 WHEN a cover letter is generated using any AI service (Anthropic, Google, OpenAI) THEN the system SHALL CONTINUE TO generate the cover letter content correctly

3.3 WHEN conversation history is maintained during cover letter generation THEN the system SHALL CONTINUE TO preserve and update the conversation state in the `conversations` table

3.4 WHEN the admin page queries the database THEN it SHALL CONTINUE TO correctly display data from all tables via Prisma

3.5 WHEN cover letter samples are saved THEN the system SHALL CONTINUE TO use the existing `/api/cover-letter-samples` endpoint (this functionality is separate and working)
