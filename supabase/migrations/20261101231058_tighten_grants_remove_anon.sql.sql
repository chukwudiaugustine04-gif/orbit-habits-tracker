/*
# Tighten table grants: remove anon role access

## Purpose
The app has a sign-in screen and all RLS policies are scoped to
`authenticated` only via `auth.uid() = user_id`. However, the `anon`
role was previously granted full CRUD on all four tables. While RLS
policies still prevent anon from seeing rows (no anon policies exist),
removing the grants follows least-privilege: anon should have no
direct table access at all.

## Changes
1. REVOKE all privileges from `anon` on: habits, streaks,
   completion_logs, user_profiles.
2. Keep `authenticated` CRUD grants (already present, unchanged).
3. No RLS policy changes — existing owner-scoped policies remain.

## Security
- anon role: no table access (grants removed).
- authenticated role: CRUD on all tables (unchanged).
- RLS remains enabled on all tables with auth.uid()-based policies.
*/

REVOKE ALL ON habits FROM anon;
REVOKE ALL ON streaks FROM anon;
REVOKE ALL ON completion_logs FROM anon;
REVOKE ALL ON user_profiles FROM anon;