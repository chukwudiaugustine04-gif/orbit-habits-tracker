import { supabase } from '@/lib/supabase';
import type { Habit } from '@/lib/types';

/**
 * A day counts toward the streak when the number of completion logs
 * for that day is at least the number of habits the user currently has
 * (and there is at least one habit). This derives the streak directly
 * from completion_logs so it never desyncs from the streaks table.
 */
export function computeStreakFromLogs(
  habits: Habit[],
  completionDates: string[]
): number {
  if (habits.length === 0) return 0;
  const totalHabits = habits.length;

  // Build a map of date -> count of completions
  const countsByDate = new Map<string, number>();
  for (const dateStr of completionDates) {
    const normalized = normalizeDate(dateStr);
    countsByDate.set(normalized, (countsByDate.get(normalized) || 0) + 1);
  }

  // Walk backwards from today. Today only counts if it's already complete;
  // otherwise we start from yesterday so an in-progress today doesn't break
  // the displayed streak.
  let streak = 0;
  const today = new Date();
  const todayStr = normalizeDate(today.toISOString());

  const todayComplete = (countsByDate.get(todayStr) || 0) >= totalHabits;
  const startOffset = todayComplete ? 0 : 1;

  for (let i = startOffset; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = normalizeDate(d.toISOString());
    const count = countsByDate.get(key) || 0;
    if (count >= totalHabits) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function normalizeDate(iso: string): string {
  // Returns YYYY-MM-DD in local time
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface StreakData {
  currentStreak: number;
  habits: Habit[];
  completionDates: string[];
}

export async function loadStreakData(): Promise<StreakData> {
  const [habitsRes, logsRes] = await Promise.all([
    supabase.from('habits').select('*').order('position', { ascending: true }),
    supabase.from('completion_logs').select('completed_date').order('completed_date', { ascending: false }),
  ]);

  const habits = (habitsRes.data as Habit[]) || [];
  const completionDates = (logsRes.data?.map((r) => r.completed_date as string)) || [];

  return {
    currentStreak: computeStreakFromLogs(habits, completionDates),
    habits,
    completionDates,
  };
}
