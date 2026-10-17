/*
# Create habits and streaks tables for Orbit

## Purpose
Stores per-user sequential habit tasks with start/end times and daily streak data.

## New Tables

### habits
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with cascade delete)
- `title` (text, not null) — e.g. "Praying", "Brushing"
- `start_time` (time, not null) — e.g. "04:30"
- `end_time` (time, not null) — e.g. "05:00"
- `position` (integer, not null, default 0) — ordering for sequential locking
- `completed` (boolean, not null, default false) — whether task is done today
- `completed_at` (timestamptz, nullable) — when it was marked complete
- `created_at` (timestamptz, default now())

### streaks
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with cascade delete)
- `date` (date, not null) — the day this streak record is for
- `all_completed` (boolean, not null, default false) — whether all habits were completed that day
- `current_streak` (integer, not null, default 0) — running streak count
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on both tables.
- Owner-scoped CRUD policies (4 per table) using auth.uid() = user_id.
- user_id columns default to auth.uid() so inserts work without explicitly passing user_id.

## Unique Constraints
- Unique on (user_id, date) for streaks — one streak record per user per day.
*/

CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  position integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_habits" ON habits;
CREATE POLICY "select_own_habits" ON habits FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_habits" ON habits;
CREATE POLICY "insert_own_habits" ON habits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_habits" ON habits;
CREATE POLICY "update_own_habits" ON habits FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_habits" ON habits;
CREATE POLICY "delete_own_habits" ON habits FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  all_completed boolean NOT NULL DEFAULT false,
  current_streak integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_streaks" ON streaks;
CREATE POLICY "select_own_streaks" ON streaks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_streaks" ON streaks;
CREATE POLICY "insert_own_streaks" ON streaks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_streaks" ON streaks;
CREATE POLICY "update_own_streaks" ON streaks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_streaks" ON streaks;
CREATE POLICY "delete_own_streaks" ON streaks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS streaks_user_date_unique ON streaks(user_id, date);
CREATE INDEX IF NOT EXISTS habits_user_position ON habits(user_id, position);