# Docker Deployment Plan for Job Posting Analyzer

## Overview

This plan outlines the dockerization of the Nuxt 3 Job Posting Analyzer application for local development and deployment. The goal is to make the application readily available while maintaining security for private use and including environment variables in the deployment.

## Current Application Analysis

### Technology Stack
- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Runtime**: Node.js (ESM modules)
- **Package Manager**: npm
- **Build Tool**: Nuxt's built-in Vite-based build system
- **Dependencies**: AI SDKs (Anthropic, Google), PDF.js, TailwindCSS

### Environment Configuration
- Uses `runtimeConfig` in `nuxt.config.ts`
- Requires API keys for Gemini and Anthropic services
- Configurable base URL for different environments
- Current `.env.example` shows expected variables

## Deployment Options

### Option 1: Single-Stage Production Build (Recommended)
**Best for**: Ready-to-use deployment with smaller image size

**Pros:**
- Smaller final image size (~200-400MB)
- Production-optimized
- Faster container startup
- Security-focused (no dev dependencies in final image)

**Cons:**
- Longer build time
- Less flexibility for debugging
- Requires rebuild for code changes

### Option 2: Development-Focused Build
**Best for**: Active development and debugging

**Pros:**
- Faster rebuilds during development
- Full development toolchain available
- Hot reload capabilities
- Easier debugging

**Cons:**
- Larger image size (~800MB-1GB)
- Includes unnecessary dev dependencies in production
- Potential security concerns with dev tools

### Option 3: Multi-Stage Build (Optimal)
**Best for**: Production deployment with development flexibility

**Pros:**
- Small production image
- Separate development stage available
- Best of both worlds
- Industry best practice

**Cons:**
- More complex Dockerfile
- Slightly longer initial build time

## Recommended Implementation Plan

### Phase 1: Basic Dockerization

#### 1.1 Create Dockerfile (Multi-Stage Build)
```dockerfile
# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

#### 1.2 Create .dockerignore
```dockerignore
node_modules
.nuxt
.output
.git
.env
notes
README.md
*.log
.DS_Store
tests
jest.config.js
```

#### 1.3 Create docker-compose.yml
```yaml
version: '3.8'

services:
  job-analyzer:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GEMINI_MODEL=${GEMINI_MODEL:-gemini-pro}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ANTHROPIC_MODEL=${ANTHROPIC_MODEL:-claude-2}
      - BASE_URL=http://localhost:3000
    volumes:
      - app-storage:/app/storage
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  app-storage:
```

### Phase 2: Configuration Updates

#### 2.1 Update nuxt.config.ts
No changes are required in `nuxt.config.ts` for the host and port configuration. Nuxt 3 automatically respects the `HOST` and `PORT` environment variables, which are set in the `Dockerfile`. The `runtimeConfig` for `baseUrl` should still be checked to ensure it correctly uses environment variables.

#### 2.2 Update package.json scripts
```json
{
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "test": "jest",
    "docker:build": "docker build -t job-posting-analyzer .",
    "docker:run": "docker-compose up -d",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up",
    "docker:stop": "docker-compose down"
  }
}
```

### Phase 3: Development Workflow

#### 3.1 Create docker-compose.dev.yml
```yaml
version: '3.8'

services:
  job-analyzer-dev:
    build:
      context: .
      target: development
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GEMINI_MODEL=${GEMINI_MODEL:-gemini-pro}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ANTHROPIC_MODEL=${ANTHROPIC_MODEL:-claude-2}
      - BASE_URL=http://localhost:3000
    volumes:
      - .:/app
      - /app/node_modules
      - app-storage:/app/storage
    restart: unless-stopped

volumes:
  app-storage:
```

#### 3.2 Create startup scripts

**scripts/docker-setup.sh**
```bash
#!/bin/bash
# Setup script for Docker deployment

echo "Setting up Job Posting Analyzer Docker environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your API keys before running docker-compose up"
    exit 1
fi

# Build and start the application
echo "Building and starting Docker containers..."
docker-compose up -d

echo "Application should be available at http://localhost:3000"
echo "Use 'docker-compose logs -f' to view logs"
```

### Phase 4: Storage Considerations

#### 4.1 Persistent Storage Strategy
Since the app uses client-side storage, we need to consider:

1. **Local Storage**: Remains browser-specific, no Docker changes needed
2. **File Storage**: If implementing server-side file storage, add volume mounts
3. **Analysis History**: Currently client-side, consider server-side persistence

#### 4.2 Optional: Server-Side Storage Enhancement
```yaml
# Add to docker-compose.yml volumes section
volumes:
  - ./data:/app/data  # For uploaded files
  - app-storage:/app/storage  # For application data
```

## Implementation Steps

### Step 1: Prepare Docker Files
1. Create Dockerfile with multi-stage build
2. Create .dockerignore file
3. Create docker-compose.yml and docker-compose.dev.yml
4. Create setup script

### Step 2: Update Configuration
1. Modify nuxt.config.ts for Docker compatibility
2. Update package.json with Docker scripts
3. Ensure .env file is properly configured

### Step 3: Test Deployment
1. Build Docker image: `npm run docker:build`
2. Test development mode: `docker-compose -f docker-compose.dev.yml up`
3. Test production mode: `npm run docker:run`
4. Verify all AI services work correctly
5. Test file upload functionality

### Step 4: Documentation
1. Update README.md with Docker instructions
2. Document environment variable requirements
3. Create troubleshooting guide

## Required Configuration Changes

### Critical Updates Needed:

1. **nuxt.config.ts**: Add host: '0.0.0.0' for Docker networking
2. **Package.json**: Add Docker convenience scripts
3. **Environment Variables**: Ensure all required vars are documented
4. **Port Configuration**: Make port configurable via environment

### Optional Enhancements:

1. **Health Checks**: Add endpoint for container health monitoring
2. **Logging**: Configure structured logging for container environments
3. **SSL/TLS**: Add HTTPS support for production deployment
4. **Resource Limits**: Configure memory and CPU limits

## Security Considerations

Since this is for private use with .env included:

1. **Network Security**: Use Docker networks to isolate containers
2. **File Permissions**: Ensure proper file permissions in container
3. **API Key Security**: Environment variables are properly scoped
4. **Update Strategy**: Plan for regular security updates

## Monitoring and Maintenance

1. **Health Checks**: Container health monitoring
2. **Log Management**: Centralized logging with docker-compose logs
3. **Backup Strategy**: Plan for data backup if server-side storage is added
4. **Update Process**: Strategy for updating the containerized application

## Future Enhancements

1. **Database Integration**: If moving from client-side to server-side storage
2. **Load Balancing**: If scaling becomes necessary
3. **CI/CD Pipeline**: Automated building and deployment
4. **Monitoring Stack**: Prometheus/Grafana integration

## Estimated Timeline

- **Phase 1 (Basic Dockerization)**: 2-4 hours
- **Phase 2 (Configuration Updates)**: 1-2 hours  
- **Phase 3 (Development Workflow)**: 1-2 hours
- **Phase 4 (Storage Considerations)**: 1-3 hours (depending on complexity)
- **Testing and Documentation**: 2-3 hours

**Total Estimated Time**: 7-14 hours depending on complexity and testing thoroughness.

## Next Steps

1. Review this plan and confirm approach
2. Implement Phase 1 (basic Dockerization)
3. Test basic functionality
4. Iterate through remaining phases
5. Document the final setup process

This plan provides a comprehensive approach to dockerizing the Job Posting Analyzer while maintaining its functionality and making it readily available for your use.
