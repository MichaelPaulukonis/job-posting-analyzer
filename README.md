# job posting analyzer
This is a job posting analyzer that uses Google's Gemini to analyze job postings and provide insights on the skills and qualifications required for the job. It is built using Nuxt 3, Tailwind CSS, and TypeScript.

Google Copilot did a bunch of heavy lifting on the setup.

## installation
To use the Google Gemini API, you'll need to install the Google Generative AI package.

`npm install @google/generative-ai`

TODO: This is currently listed as a requirement, but it should be an option.


## Node Version Management & Environment Setup

This project requires **Node.js 23**. To ensure all contributors use the correct version, we use both a `.nvmrc` file and [direnv](https://direnv.net/) for automatic environment management.

### Quick Setup

1. **Install [nvm](https://github.com/nvm-sh/nvm) and [direnv](https://direnv.net/):**
   ```sh
   brew install nvm direnv
   ```

2. **Hook direnv into your shell:**
   - For zsh, add to your `~/.zshrc`:
     ```sh
     eval "$(direnv hook zsh)"
     ```

3. **Allow direnv in this project directory:**
   ```sh
   cd /path/to/job-posting-analyzer
   direnv allow
   ```

4. **Result:**  
   Every time you enter this directory, direnv will automatically activate the correct Node version (as specified in `.nvmrc`) using nvm.

### Why?

- Ensures all contributors and CI use the same Node version.
- No need to manually run `nvm use`—it’s automatic.
- `.envrc` and `.nvmrc` are committed for team consistency.


## Setup

Make sure to install dependencies:

```bash
# npm
npm install
```

TODO: document API keys 

### Firebase Setup (optional - required for auth)
To use Firebase Authentication and verify ID tokens on the server, follow these steps:
1. Create a Firebase project and add a Web App to obtain client SDK configuration.
2. Add the client config to `.env` or your hosting platform's environment variables as `NUXT_PUBLIC_FIREBASE_API_KEY`, `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc. (see `docs/auth.md` for exact keys).
3. Generate a Firebase service account JSON key for server verification (Firebase Console -> Project Settings -> Service Accounts -> Generate private key). Store it securely. Locally you can set `FIREBASE_SERVICE_ACCOUNT=/path/to/key.json` or set the JSON in the env.
4. On CI or hosted environments, create a secret like `FIREBASE_SERVICE_ACCOUNT_BASE64` containing the base64-encoded service account JSON and decode it in the workflow to `FIREBASE_SERVICE_ACCOUNT` before building.

Example (GitHub Actions snippet):
```yaml
# In your workflow before building/run tests
- name: Decode Firebase service account
   run: |
      echo "${{ secrets.FIREBASE_SERVICE_ACCOUNT_BASE64 }}" | base64 --decode > firebase-service-account.json
      echo "FIREBASE_SERVICE_ACCOUNT=$(cat firebase-service-account.json)" >> $GITHUB_ENV
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```


## Docker Setup

This project uses Docker for both development and production environments. We have **three deployment scenarios** to support different workflows.

### Quick Start - Full Local Development (Recommended)

For daily development with everything running locally:

```bash
npm run dev:full
```

This starts both the Nuxt app and PostgreSQL database. Access at `http://localhost:3050`.

### All Docker Commands

```bash
# Full local development (app + database)
npm run dev:full              # Start everything
npm run dev:full:down         # Stop everything

# Local database only (run app with npm run dev)
npm run db:local:up           # Start database
npm run db:local:down         # Stop database

# Testing
npm run test:integration      # Runs tests (auto-starts test DB)

# App-only Docker (connects to external DB)
npm run docker:dev            # Development mode
npm run docker:build          # Build production
npm run docker:run            # Run production
npm run docker:stop           # Stop app containers

# AWS RDS management
npm run db:rds:status         # Check RDS status
npm run db:rds:start          # Start RDS (costs money!)
npm run db:rds:stop           # Stop RDS (save money!)
```

### Documentation

- **Quick Reference**: See [docs/DOCKER-QUICK-START.md](docs/DOCKER-QUICK-START.md)
- **Complete Guide**: See [docs/plans/docker-deployment-plan.md](docs/plans/docker-deployment-plan.md)

### Which Setup Should I Use?

| Scenario | Command | What It Does |
|----------|---------|--------------|
| Daily development | `npm run dev:full` | App + local database in Docker |
| Running tests | `npm run test:integration` | Auto-starts test database |
| Debugging with IDE | `npm run db:local:up` then `npm run dev` | Database in Docker, app on host |
| Testing with AWS | `npm run db:rds:start` then `npm run docker:dev` | App in Docker, RDS in AWS |

