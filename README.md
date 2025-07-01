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

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
