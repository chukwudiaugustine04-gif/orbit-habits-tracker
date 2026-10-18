/*
# Ensure one completion log per habit per day

## Purpose
The habit dashboard now derives today's completion state from
`completion_logs` instead of the `habits.completed` boolean. To make
that derivation reliable and to make toggling idempotent, we need a
unique constraint so a user can only have one completion log per
habit per calendar day.

## Changes
1. Add a UNIQUE constraint on `completion_logs(user_id, habit_id, completed_date)`.
   - This guarantees at most one "completed today" row per habit per day,
     so toggling can upsert/delete safely and the daily dashboard query
     can trust that a matching row means "completed today".
   - `habit_id` is nullable in the existing schema, but completion logs
     written by the dashboard always carry a `habit_id`. The constraint
     skips null `habit_id` rows (NULLs are distinct in Postgres unique
     indexes), so legacy/analytics rows without a habit_id are unaffected.

2. Create a supporting index `completion_logs_user_habit_date_unique`
   (UNIQUE) — same columns as the constraint — so the daily dashboard
   lookup by (user_id, completed_date) stays fast.

## Security
- No RLS policy changes. Existing owner-scoped policies on
  `completion_logs` still apply (`auth.uid() = user_id`).

## Notes
- This is additive only — no data is lost. Existing duplicate rows
  (if any) would block the constraint; we deduplicate first by keeping
  the earliest `completed_at` per (user_id, habit_id, completed_date)
  and deleting the rest, so history is preserved (one entry per day).
- The `habits.completed` / `habits.completed_at` columns are left in
  place to avoid data loss, but the frontend will no longer read or
  write them as the source of truth for daily completion.
*/

-- Deduplicate any existing rows so the unique constraint can be created.
-- Keep the earliest completion_at per (user_id, habit_id, completed_date).
DELETE FROM completion_logs a
USING completion_logs b
WHERE a.habit_id IS NOT NULL
  AND b.habit_id IS NOT NULL
  AND a.user_id = b.user_id
  AND a.habit_id = b.habit_id
  AND a.completed_date = b.completed_date
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS completion_logs_user_habit_date_unique
  ON completion_logs(user_id, habit_id, completed_date);
