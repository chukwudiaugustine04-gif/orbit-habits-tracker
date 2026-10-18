import { supabase } from '@/lib/supabase';
import type { Habit } from '@/lib/types';

/**
 * Returns today's date in the user's local timezone as YYYY-MM-DD.
 * We use local time (not UTC) so "today" matches what the user sees on
 * their calendar and so the daily reset happens at local midnight.
 */
export function todayLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Load all of the user's habits plus the set of habit ids that have a
 * completion log for today (local calendar date). Completion state for
 * the daily dashboard is derived purely from completion_logs — the
 * habits.completed boolean is no longer used as source of truth, so
 * habits naturally show as incomplete at the start of each new day
 * without any destructive reset.
 */
export async function loadHabitsWithTodayCompletion(): Promise<Habit[]> {
  const today = todayLocalDate();

  const [habitsRes, logsRes] = await Promise.all([
    supabase.from('habits').select('*').order('position', { ascending: true }),
    supabase
      .from('completion_logs')
      .select('habit_id, completed_date')
      .eq('completed_date', today),
  ]);

  if (habitsRes.error) {
    console.error('Failed to load habits:', habitsRes.error.message);
    return [];
  }

  const completedHabitIds = new Set(
    (logsRes.data || [])
      .map((r) => r.habit_id as string | null)
      .filter((id): id is string => !!id)
  );

  const habits = (habitsRes.data as Habit[]) || [];
  return habits.map((h) => ({
    ...h,
    // Derive today's completion from the log set. Past days' logs remain
    // in the database untouched and still power streaks/analytics.
    completed: completedHabitIds.has(h.id),
    completed_at: completedHabitIds.has(h.id) ? h.completed_at : null,
  }));
}

/**
 * Mark a habit complete for today by inserting a completion_log entry
 * (idempotent thanks to the unique index on user_id, habit_id, completed_date).
 */
export async function logHabitCompletion(habit: Habit): Promise<void> {
  const today = todayLocalDate();
  const now = new Date();

  const { error } = await supabase.from('completion_logs').upsert(
    {
      habit_id: habit.id,
      habit_title: habit.title,
      completed_date: today,
      completed_at: now.toISOString(),
      day_of_week: now.getDay(),
    },
    { onConflict: 'user_id,habit_id,completed_date' }
  );

  if (error) throw new Error(error.message);
}

/**
 * Mark a habit incomplete for today by deleting today's completion_log
 * entry. Past days' logs are never touched, so history and streaks stay
 * intact.
 */
export async function clearHabitCompletionToday(habitId: string): Promise<void> {
  const today = todayLocalDate();

  const { error } = await supabase
    .from('completion_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('completed_date', today);

  if (error) throw new Error(error.message);
}
