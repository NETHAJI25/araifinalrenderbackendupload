-- Innovators Arena 2.0 — Supabase Postgres schema
-- Run once against the database. Tables use snake_case columns;
-- API responses keep the existing camelCase shapes (map in controllers).

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  course TEXT,
  year TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  linkedin TEXT,
  github TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  payment_status TEXT DEFAULT 'pending',
  team_id TEXT,
  role TEXT DEFAULT 'participant',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY,
  team_id TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  leader_id UUID REFERENCES users(id),
  problem_statement_id TEXT,
  problem_statement_title TEXT,
  status TEXT DEFAULT 'active',
  confirmation_status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  round INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  college TEXT,
  role TEXT DEFAULT 'Member',
  payment_status TEXT DEFAULT 'pending',
  profile_completed BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INT DEFAULT 200,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'Normal',
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY,
  submission_id TEXT UNIQUE,
  team_id TEXT REFERENCES teams(team_id) ON DELETE CASCADE,
  project_name TEXT,
  description TEXT DEFAULT '',
  presentation_url TEXT,
  code_url TEXT,
  demo_video_url TEXT,
  status TEXT DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_team_id ON teams(team_id);
CREATE INDEX IF NOT EXISTS idx_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
