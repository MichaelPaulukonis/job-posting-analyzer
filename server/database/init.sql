-- Database Initialization Script for job-posting-analyzer
-- This script sets up required PostgreSQL extensions

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extensions are installed
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector')
ORDER BY extname;
