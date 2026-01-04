-- Run in the Postgres container or using psql connected to the postgres service

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id TEXT,
  region TEXT,
  input_raw TEXT,
  ingredients TEXT[],
  ocr_confidence REAL,
  llm_response JSONB
);
