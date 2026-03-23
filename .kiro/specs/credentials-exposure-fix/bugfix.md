# Bugfix Requirements Document

## Introduction

Database credentials including production RDS passwords are exposed in plain-text within documentation files (`docs/database-setup.md` and `scripts/db/README.md`). This security vulnerability allows anyone with repository access to view and potentially misuse production database credentials. The exposed credentials include:

- Production RDS: `postgresql://[USERNAME]:[EXPOSED_PASSWORD]@[RDS_ENDPOINT]:5432/jobanalyzer`
- Local Dev: `postgresql://[USERNAME]:[EXPOSED_PASSWORD]@localhost:5434/jobanalyzer`
- Test: `postgresql://[USERNAME]:[EXPOSED_PASSWORD]@localhost:5433/jobanalyzer`

This fix will remove all plain-text credentials from documentation, replace them with placeholder values, and ensure that real credentials only exist in `.env` files (which are properly gitignored). Additionally, the production RDS password must be rotated since it has been compromised.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN documentation files are viewed in the repository THEN the system exposes production RDS password in plain text in `docs/database-setup.md`

1.2 WHEN documentation files are viewed in the repository THEN the system exposes production RDS password in plain text in `scripts/db/README.md`

1.3 WHEN documentation files are viewed in the repository THEN the system exposes local development password in plain text in both documentation files

1.4 WHEN documentation files are viewed in the repository THEN the system exposes test database password in plain text in both documentation files

1.5 WHEN documentation files are viewed in the repository THEN the system displays complete connection strings with usernames, passwords, and hostnames in example code blocks

1.6 WHEN the git repository is cloned THEN the system provides access to all historical versions of exposed credentials through git history

### Expected Behavior (Correct)

2.1 WHEN documentation files are viewed in the repository THEN the system SHALL display placeholder values like `[PASSWORD]` or `${DB_PASSWORD}` instead of actual passwords

2.2 WHEN documentation examples show connection strings THEN the system SHALL use environment variable references (e.g., `${DATABASE_URL}`) or clearly marked placeholders (e.g., `[YOUR_PASSWORD]`)

2.3 WHEN documentation references database credentials THEN the system SHALL direct users to `.env` files or environment variable configuration

2.4 WHEN production RDS password has been exposed THEN the system SHALL require password rotation through AWS RDS console or CloudFormation

2.5 WHEN documentation provides setup instructions THEN the system SHALL instruct users to copy `.env.example` to `.env` and configure their own credentials

2.6 WHEN example connection strings are needed THEN the system SHALL show the structure without revealing actual credentials (e.g., `postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN users follow documentation setup instructions THEN the system SHALL CONTINUE TO provide clear, actionable steps for database configuration

3.2 WHEN developers need to switch between database environments THEN the system SHALL CONTINUE TO explain the process using environment files

3.3 WHEN documentation describes database workflows THEN the system SHALL CONTINUE TO provide comprehensive examples of common operations

3.4 WHEN users reference NPM scripts THEN the system SHALL CONTINUE TO document all available database management commands

3.5 WHEN troubleshooting database issues THEN the system SHALL CONTINUE TO provide helpful debugging steps and common solutions

3.6 WHEN documentation explains cost comparisons THEN the system SHALL CONTINUE TO provide accurate cost information for different database options

3.7 WHEN `.env` files contain actual credentials THEN the system SHALL CONTINUE TO exclude them from git via `.gitignore`

3.8 WHEN local development uses simple passwords THEN the system SHALL CONTINUE TO allow this for non-production environments (with documentation noting this is acceptable for local dev only)
