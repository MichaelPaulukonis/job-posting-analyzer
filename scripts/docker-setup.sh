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
