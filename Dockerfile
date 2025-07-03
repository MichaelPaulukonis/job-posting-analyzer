# Use an official Node.js runtime as a parent image
FROM node:23-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# -- End of base stage --

# ----------------------------------------------------------------------------

# Development stage
FROM base AS dev

# Install all dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the app in development mode
CMD ["npm", "run", "dev"]

# -- End of dev stage --

# ----------------------------------------------------------------------------

# Build stage
FROM base AS builder

# Install only production dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the Nuxt.js application
RUN npm run build

# -- End of builder stage --

# ----------------------------------------------------------------------------

# Production stage
FROM node:23-alpine AS production

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 3000

# Set the host and port for the server
ENV HOST=0.0.0.0
ENV PORT=3000

# Start the app in production mode
CMD ["node", ".output/server/index.mjs"]
