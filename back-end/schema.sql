-- EEC Club Database Schema
-- Run: psql -d eeclub -f schema.sql

-- ─── Courses ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  course_id       TEXT PRIMARY KEY,      -- e.g. "EE201"
  title           TEXT NOT NULL,
  description     TEXT,
  level           INTEGER NOT NULL,      -- 1–5
  credits         INTEGER NOT NULL DEFAULT 3,
  difficulty      NUMERIC(3,1) NOT NULL DEFAULT 3.0,  -- 0.0–5.0
  prerequisites   TEXT,                 -- comma-separated course IDs
  objectives      TEXT,                 -- comma-separated strings
  books           TEXT                  -- JSON: [{title, file}] — uploaded PDF filenames
);

-- ─── Resources ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id             SERIAL PRIMARY KEY,
  course_id      TEXT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  resource_title TEXT NOT NULL,
  url            TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN ('Lecture','Exam','Material','Other'))
);

-- ─── Events ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                 SERIAL PRIMARY KEY,
  event_title        TEXT NOT NULL,
  description        TEXT,
  category           TEXT NOT NULL DEFAULT 'General',  -- Workshop, Hackathon, Career, General
  location           TEXT,
  time               TEXT,                              -- e.g. "3:00 PM – 6:00 PM"
  start_date         DATE,
  end_date           DATE,
  status             TEXT NOT NULL DEFAULT 'Auto'
                       CHECK (status IN ('Active','Upcoming','Complete','Auto')),
  registration_link  TEXT,
  image              TEXT                               -- JSON array stored as text, or a URL
);

-- ─── Members ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  linkedin    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  term        TEXT NOT NULL DEFAULT '1',
  image       TEXT                              -- JSON array stored as text, or a URL
);

-- ─── Club Stats (single row) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS club_stats (
  id                     SERIAL PRIMARY KEY,
  active_members         INTEGER NOT NULL DEFAULT 0,
  workshops_per_year     INTEGER NOT NULL DEFAULT 0,
  industry_partners      INTEGER NOT NULL DEFAULT 0,
  current_term           INTEGER NOT NULL DEFAULT 1,
  commitment_percentage  INTEGER NOT NULL DEFAULT 0,
  club_email             TEXT,
  club_insta             TEXT,
  club_linked            TEXT,
  club_location          TEXT,
  club_x                 TEXT
);

-- Insert a default stats row if none exists
INSERT INTO club_stats (active_members, workshops_per_year, industry_partners, current_term, commitment_percentage)
VALUES (50, 8, 10, 1, 90)
ON CONFLICT DO NOTHING;
