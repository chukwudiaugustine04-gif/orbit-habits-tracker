import { useCallback, useEffect, useRef, useState } from 'react';
import { playDefaultAlertChime } from '@/lib/alarmSettings';
import { todayLocalDate } from '@/lib/habitDaily';

export interface DueTaskHabit {
  id: string;
  title: string;
  start_time: string;
  completed: boolean;
}

export interface DueToast {
  habitId: string;
  title: string;
}

const SNOOZE_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 15000;
const CHIME_DURATION_MS = 8000;

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function useDueTaskToasts(habits: DueTaskHabit[], onComplete: (habitId: string) => void) {
  const [toasts, setToasts] = useState<DueToast[]>([]);
  const firedRef = useRef<Set<string>>(new Set());
  const snoozedRef = useRef<Map<string, number>>(new Map());
  const chimesRef = useRef<Map<string, { stop: () => void }>>(new Map());
  const habitsRef = useRef(habits);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    habitsRef.current = habits;
    onCompleteRef.current = onComplete;
  }, [habits, onComplete]);

  const stopChime = useCallback((habitId: string) => {
    chimesRef.current.get(habitId)?.stop();
    chimesRef.current.delete(habitId);
  }, []);

  const removeToast = useCallback((habitId: string) => {
    stopChime(habitId);
    setToasts((prev) => prev.filter((t) => t.habitId !== habitId));
  }, [stopChime]);

  const fire = useCallback((habit: DueTaskHabit) => {
    setToasts((prev) =>
      prev.some((t) => t.habitId === habit.id) ? prev : [...prev, { habitId: habit.id, title: habit.title }]
    );
    stopChime(habit.id);
    playDefaultAlertChime()
      .then((handle) => {
        chimesRef.current.set(habit.id, handle);
        setTimeout(() => stopChime(habit.id), CHIME_DURATION_MS);
      })
      .catch(() => {});
  }, [stopChime]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const today = todayLocalDate();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      for (const habit of habitsRef.current) {
        if (habit.completed) continue;

        const snoozeUntil = snoozedRef.current.get(habit.id);
        if (snoozeUntil !== undefined) {
          if (now.getTime() < snoozeUntil) continue;
          snoozedRef.current.delete(habit.id);
          fire(habit);
          continue;
        }

        const dedupeKey = `${today}-${habit.id}`;
        if (firedRef.current.has(dedupeKey)) continue;
        if (minutesOf(habit.start_time) === nowMinutes) {
          firedRef.current.add(dedupeKey);
          fire(habit);
        }
      }
    };

    tick();
    const interval = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fire]);

  useEffect(() => {
    const completedIds = new Set(habits.filter((h) => h.completed).map((h) => h.id));
    setToasts((prev) => {
      const next = prev.filter((t) => !completedIds.has(t.habitId));
      return next.length === prev.length ? prev : next;
    });
  }, [habits]);

  useEffect(() => {
    const chimes = chimesRef.current;
    return () => {
      chimes.forEach((handle) => handle.stop());
      chimes.clear();
    };
  }, []);

  const complete = useCallback((habitId: string) => {
    snoozedRef.current.delete(habitId);
    removeToast(habitId);
    onCompleteRef.current(habitId);
  }, [removeToast]);

  const snooze = useCallback((habitId: string) => {
    snoozedRef.current.set(habitId, Date.now() + SNOOZE_MS);
    removeToast(habitId);
  }, [removeToast]);

  const dismiss = useCallback((habitId: string) => {
    removeToast(habitId);
  }, [removeToast]);

  return { toasts, complete, snooze, dismiss };
}
