/*
# Add category column to habits table

1. Changes
- Add `category` column to `habits` table (text, nullable, defaults to 'Personal').
  Stores a habit category tag: one of 'Health', 'Work', 'Personal', 'Mindset'.
  Nullable so existing rows remain valid; defaults to 'Personal' for new inserts
  that omit the field.
2. Security
- No RLS policy changes. Existing owner-scoped policies on `habits` still apply
  and continue to scope access by `auth.uid() = user_id`.
3. Notes
- This is additive only — no data is lost. Existing habits keep their current
  values and gain a 'Personal' category by default.
*/

ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'Personal';

-- Backfill any null categories so the filter UI always has a value to show
UPDATE habits SET category = 'Personal' WHERE category IS NULL;
