-- Signal Feedback Database Schema
-- Run this with: npx wrangler d1 execute cloudflare-signal-db --local --file=./schema.sql

CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT,
  timestamp TEXT,
  tags TEXT, -- JSON array stored as text
  status TEXT DEFAULT 'new',
  priority TEXT,
  
  -- AI Analysis fields
  type TEXT NOT NULL, -- 'bug' or 'feedback'
  theme TEXT NOT NULL,
  severity TEXT, -- P0, P1, P2, P3 (for bugs)
  feedback_priority TEXT, -- high, medium-high, medium, low (for feedback)
  user_tier TEXT, -- Enterprise, Business, Free, Unknown
  sentiment TEXT, -- positive, negative, neutral
  key_points TEXT, -- JSON array stored as text
  suggested_tags TEXT, -- JSON array stored as text
  summary TEXT,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_theme ON feedbacks(theme);
CREATE INDEX IF NOT EXISTS idx_type ON feedbacks(type);
CREATE INDEX IF NOT EXISTS idx_severity ON feedbacks(severity);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedbacks(feedback_priority);
CREATE INDEX IF NOT EXISTS idx_created_at ON feedbacks(created_at);

