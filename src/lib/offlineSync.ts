import { supabase } from '@/lib/supabase';
import type { Habit } from '@/lib/types';

const QUEUE_KEY = 'orbit-pending-completions';
const CACHE_KEY = 'orbit-habits-cache';
const FOREIGN_KEY_VIOLATION = '23503';

export interface PendingCompletion {
  id: string;
  habitId: string;
  habitTitle: string;
  action: 'complete' | 'uncomplete';
  completedDate: string;
  queuedAt: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadPendingCompletions(): PendingCompletion[] {
  return readJson<PendingCompletion[]>(QUEUE_KEY, []);
}

export function isNetworkFailure(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /fetch|network/i.test(message);
}

/** The latest intent for a habit on a given day replaces any earlier queued one. */
export function enqueueCompletion(
  habit: Pick<Habit, 'id' | 'title'>,
  action: PendingCompletion['action'],
  completedDate: string
): void {
  const remaining = loadPendingCompletions().filter(
    (p) => !(p.habitId === habit.id && p.completedDate === completedDate)
  );
  remaining.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    habitId: habit.id,
    habitTitle: habit.title,
    action,
    completedDate,
    queuedAt: new Date().toISOString(),
  });
  writeJson(QUEUE_KEY, remaining);
}

async function applyPending(op: PendingCompletion): Promise<{ error: string | null }> {
  if (op.action === 'complete') {
    const queuedAt = new Date(op.queuedAt);
    const { error } = await supabase.from('completion_logs').upsert(
      {
        habit_id: op.habitId,
        habit_title: op.habitTitle,
        completed_date: op.completedDate,
        completed_at: queuedAt.toISOString(),
        day_of_week: queuedAt.getDay(),
      },
      { onConflict: 'user_id,habit_id,completed_date' }
    );
    if (error && error.code !== FOREIGN_KEY_VIOLATION) return { error: error.message };
    return { error: null };
  }

  const { error } = await supabase
    .from('completion_logs')
    .delete()
    .eq('habit_id', op.habitId)
    .eq('completed_date', op.completedDate);
  return { error: error ? error.message : null };
}

/**
 * Sends queued completions in order. Stops at the first failure so nothing is
 * dropped or reordered; the remaining items stay queued for the next attempt.
 */
export async function flushPendingCompletions(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  let synced = 0;
  for (;;) {
    const next = loadPendingCompletions()[0];
    if (!next) break;
    const { error } = await applyPending(next);
    if (error) {
      console.error('Offline sync paused:', error);
      break;
    }
    writeJson(
      QUEUE_KEY,
      loadPendingCompletions().filter((p) => p.id !== next.id)
    );
    synced++;
  }
  return synced;
}

export function cacheHabits(habits: Habit[]): void {
  writeJson(CACHE_KEY, habits);
}

export function loadCachedHabits(): Habit[] {
  return readJson<Habit[]>(CACHE_KEY, []);
}

/** Overlays queued-but-unsynced completions so the UI matches what the user did offline. */
export function applyPendingToHabits(habits: Habit[], today: string): Habit[] {
  const pendingByHabit = new Map(
    loadPendingCompletions()
      .filter((p) => p.completedDate === today)
      .map((p) => [p.habitId, p])
  );
  if (pendingByHabit.size === 0) return habits;

  return habits.map((habit) => {
    const pending = pendingByHabit.get(habit.id);
    if (!pending) return habit;
    const done = pending.action === 'complete';
    return { ...habit, completed: done, completed_at: done ? pending.queuedAt : null };
  });
}
