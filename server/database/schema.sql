-- ============================================================================
-- DEPRECATED: This SQL schema file is no longer used
-- ============================================================================
-- 
-- This project now uses Prisma ORM for database management.
-- See: prisma/schema.prisma for the current schema definition
-- See: docs/database/PRISMA_SETUP.md for usage guide
-- See: docs/database/MIGRATION_GUIDE.md for migration information
--
-- This file is kept for reference only.
--
-- ============================================================================

-- Database Schema for job-posting-analyzer
-- PostgreSQL with pgvector extension
-- Created: 2026-02-13

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (for future multi-user support)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resume embeddings table (for semantic search)
CREATE TABLE IF NOT EXISTS resume_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,  -- OpenAI ada-002/text-embedding-3-small
  chunk_text TEXT,  -- Optional: store the text chunk this embedding represents
  chunk_index INTEGER,  -- For ordering chunks
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  company VARCHAR(255),
  content TEXT NOT NULL,
  url TEXT,
  location VARCHAR(255),
  salary_range VARCHAR(100),
  metadata JSONB DEFAULT '{}',  -- Store additional fields like remote_type, benefits, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job posting embeddings table (for semantic search)
CREATE TABLE IF NOT EXISTS job_posting_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  chunk_text TEXT,
  chunk_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analysis results table (stores resume vs job posting comparisons)
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  matches TEXT[] DEFAULT '{}',  -- Array of matching skills/keywords
  gaps TEXT[] DEFAULT '{}',  -- Array of missing skills/keywords
  suggestions TEXT[] DEFAULT '{}',  -- Array of improvement suggestions
  similarity_score DECIMAL(5,4),  -- 0.0000 to 1.0000
  analysis_metadata JSONB DEFAULT '{}',  -- Store AI model used, prompt version, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cover letters table
CREATE TABLE IF NOT EXISTS cover_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_result_id UUID REFERENCES analysis_results(id) ON DELETE SET NULL,
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,  -- For tracking iterations
  metadata JSONB DEFAULT '{}',  -- Store generation parameters, model used, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations table (for chat history)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',  -- Array of {role, content, timestamp}
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Resume indexes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_name ON resumes(name);

-- Resume embedding indexes (for vector similarity search)
CREATE INDEX IF NOT EXISTS idx_resume_embeddings_resume_id ON resume_embeddings(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_embeddings_vector 
  ON resume_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Job posting indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_user_id ON job_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_title ON job_postings(title);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company);

-- Job posting embedding indexes
CREATE INDEX IF NOT EXISTS idx_job_posting_embeddings_job_id ON job_posting_embeddings(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_posting_embeddings_vector 
  ON job_posting_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Analysis result indexes
CREATE INDEX IF NOT EXISTS idx_analysis_results_resume_id ON analysis_results(resume_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_job_posting_id ON analysis_results(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_similarity_score ON analysis_results(similarity_score DESC);

-- Cover letter indexes
CREATE INDEX IF NOT EXISTS idx_cover_letters_resume_id ON cover_letters(resume_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_job_posting_id ON cover_letters(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_analysis_result_id ON cover_letters(analysis_result_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_created_at ON cover_letters(created_at DESC);

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_resume_id ON conversations(resume_id);
CREATE INDEX IF NOT EXISTS idx_conversations_job_posting_id ON conversations(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_results_updated_at BEFORE UPDATE ON analysis_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cover_letters_updated_at BEFORE UPDATE ON cover_letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS (Optional - for common queries)
-- ============================================================================

-- View for latest analysis per resume-job combination
CREATE OR REPLACE VIEW latest_analysis AS
SELECT DISTINCT ON (resume_id, job_posting_id)
  id,
  resume_id,
  job_posting_id,
  matches,
  gaps,
  suggestions,
  similarity_score,
  created_at
FROM analysis_results
ORDER BY resume_id, job_posting_id, created_at DESC;

-- View for resume with latest analysis count
CREATE OR REPLACE VIEW resume_stats AS
SELECT 
  r.id,
  r.name,
  r.created_at,
  COUNT(DISTINCT ar.job_posting_id) as jobs_analyzed,
  AVG(ar.similarity_score) as avg_similarity_score
FROM resumes r
LEFT JOIN analysis_results ar ON r.id = ar.resume_id
GROUP BY r.id, r.name, r.created_at;

-- ============================================================================
-- SAMPLE QUERIES (Commented out - for reference)
-- ============================================================================

-- Find similar resumes to a job posting
-- SELECT 
--   r.id, r.name,
--   re.embedding <-> jp_emb.embedding AS distance
-- FROM resumes r
-- JOIN resume_embeddings re ON r.id = re.resume_id
-- CROSS JOIN (
--   SELECT embedding FROM job_posting_embeddings WHERE job_posting_id = '<job_id>' LIMIT 1
-- ) jp_emb
-- ORDER BY distance
-- LIMIT 10;

-- Find similar job postings to a resume
-- SELECT 
--   jp.id, jp.title, jp.company,
--   jpe.embedding <-> r_emb.embedding AS distance
-- FROM job_postings jp
-- JOIN job_posting_embeddings jpe ON jp.id = jpe.job_posting_id
-- CROSS JOIN (
--   SELECT embedding FROM resume_embeddings WHERE resume_id = '<resume_id>' LIMIT 1
-- ) r_emb
-- ORDER BY distance
-- LIMIT 10;

-- Get analysis history for a resume
-- SELECT 
--   ar.id,
--   jp.title,
--   jp.company,
--   ar.similarity_score,
--   ar.matches,
--   ar.gaps,
--   ar.created_at
-- FROM analysis_results ar
-- JOIN job_postings jp ON ar.job_posting_id = jp.id
-- WHERE ar.resume_id = '<resume_id>'
-- ORDER BY ar.created_at DESC;
