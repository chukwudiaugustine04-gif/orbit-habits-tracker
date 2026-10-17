/*
# Create user_profiles and completion_logs tables for Orbit

## Purpose
Stores extended user profile data (Name, Email, Phone, Country, Google ID) beyond what auth.users holds,
and daily per-habit completion logs for performance analytics.

## New Tables

### user_profiles
- `id` (uuid, primary key — same as auth.users.id)
- `full_name` (text, not null) — the user's display name from onboarding
- `email` (text, nullable) — email used for auth
- `phone` (text, nullable) — phone number used for auth
- `country_code` (text, nullable) — dial code e.g. "+234"
- `country_name` (text, nullable) — country name e.g. "Nigeria"
- `google_id` (text, nullable) — Google OAuth provider ID if signed in with Google
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### completion_logs
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users cascade delete)
- `habit_id` (uuid, nullable, references habits cascade delete) — which habit was completed
- `habit_title` (text, not null) — snapshot of habit title at completion time
- `completed_date` (date, not null, default CURRENT_DATE) — which day the habit was completed
- `completed_at` (timestamptz, not null, default now()) — exact timestamp
- `day_of_week` (integer, not null, default 0) — 0=Sun..6=Sat for weekly analytics

## Security
- RLS enabled on both tables.
- user_profiles: id matches auth.uid() — owner can SELECT, INSERT, and UPDATE.
- completion_logs: owner-scoped CRUD with user_id defaulting to auth.uid().

## Indexes
- completion_logs(user_id, completed_date) for analytics queries
- user_profiles(email) for lookups
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  country_code text,
  country_name text,
  google_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS completion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE,
  habit_title text NOT NULL,
  completed_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  day_of_week integer NOT NULL DEFAULT EXTRACT(DOW FROM CURRENT_DATE)::int
);

ALTER TABLE completion_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_completion_logs" ON completion_logs;
CREATE POLICY "select_own_completion_logs" ON completion_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_completion_logs" ON completion_logs;
CREATE POLICY "insert_own_completion_logs" ON completion_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_completion_logs" ON completion_logs;
CREATE POLICY "update_own_completion_logs" ON completion_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_completion_logs" ON completion_logs;
CREATE POLICY "delete_own_completion_logs" ON completion_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS completion_logs_user_date ON completion_logs(user_id, completed_date);
CREATE INDEX IF NOT EXISTS completion_logs_habit ON completion_logs(habit_id);
CREATE INDEX IF NOT EXISTS user_profiles_email ON user_profiles(email);