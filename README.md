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


## Docker notes

This project is fully containerized using Docker and Docker Compose, providing a consistent environment for both development and production.

### Development Environment

The development environment is configured for hot-reloading, meaning any changes you make to the source code will be instantly reflected in the running container without needing to rebuild the image.

**To start the development server:**

```bash
npm run docker:dev
```

The application will be available at `http://localhost:3050`.

**When to rebuild the development image:**

You only need to rebuild the Docker image when you make changes to the underlying environment, such as:

*   Adding or removing dependencies in `package.json`.
*   Modifying the `Dockerfile`.
*   Changing the `docker-compose.dev.yml` file.

To rebuild, run:

```bash
# Stop the running containers
npm run docker:stop

# Rebuild the image and start the containers
npm run docker:dev
```

### Production Environment

The production environment uses a multi-stage Docker build to create a lean, optimized image.

**To build and run the production server:**

```bash
# Build the production image
npm run docker:build

# Start the production container
npm run docker:run
```

The application will be available at `http://localhost:3000`.

**Important:** Unlike the development setup, you **must** rebuild the image (`npm run docker:build`) every time you make code changes for them to be reflected in the production container.

### Stopping Docker Containers

To stop all running containers for this project (both dev and prod), run:

```bash
npm run docker:stop
```

