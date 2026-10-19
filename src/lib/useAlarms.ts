import { useCallback, useEffect, useRef, useState } from 'react';
import {
  startAlarm,
  decodeCustomAudio,
  type AlarmHandle,
  type AlarmSource,
} from './alarmSounds';
import { loadAlarmSettings } from './alarmSettings';
import { getSound } from './alarmStorage';

export interface AlarmHabit {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  completed: boolean;
}

export interface ActiveAlarm {
  habitId: string;
  habitTitle: string;
  type: 'start' | 'end';
  /** Epoch ms when the alarm was triggered (not the snooze target). */
  triggeredAt: number;
}

interface PendingSnooze {
  habitId: string;
  type: 'start' | 'end';
  fireAt: number; // epoch ms
}

/**
 * Build the AlarmSource for the current settings. Custom audio is loaded
 * and decoded lazily; on failure we fall back to the active preset.
 */
async function resolveAlarmSource(): Promise<AlarmSource> {
  const settings = loadAlarmSettings();
  if (settings.source === 'custom' && settings.customSoundId) {
    try {
      const stored = await getSound(settings.customSoundId);
      if (stored) {
        const buffer = await decodeCustomAudio(stored.arrayBuffer);
        return { kind: 'custom', customBuffer: buffer };
      }
    } catch {
      // fall through to preset
    }
  }
  return { kind: 'preset', presetId: settings.presetId };
}

export function useAlarms(habits: AlarmHabit[]) {
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);

  const triggeredRef = useRef<Set<string>>(new Set());
  const snoozesRef = useRef<Map<string, PendingSnooze>>(new Map());
  const habitsRef = useRef(habits);
  const alarmHandleRef = useRef<AlarmHandle | null>(null);

  habitsRef.current = habits;

  // Stop any playing alarm sound and clear the handle.
  const stopSound = useCallback(() => {
    if (alarmHandleRef.current) {
      alarmHandleRef.current.stop();
      alarmHandleRef.current = null;
    }
  }, []);

  // Request notification permission once on mount.
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Reset the per-day triggered set when the habit set length changes
  // (e.g. a new day reloads habits). Existing triggers for today remain.
  useEffect(() => {
    triggeredRef.current = new Set();
  }, [habits.length]);

  /**
   * Fire an alarm: start the looping loud sound and show the overlay.
   * The sound keeps ringing until the user dismisses it from the overlay.
   */
  const fireAlarm = useCallback(
    async (habit: AlarmHabit, type: 'start' | 'end') => {
      stopSound();
      try {
        const source = await resolveAlarmSource();
        const settings = loadAlarmSettings();
        alarmHandleRef.current = await startAlarm(source, settings.gainBoost);
      } catch {
        // audio failure is non-fatal; the overlay still shows
      }
      setActiveAlarm({
        habitId: habit.id,
        habitTitle: habit.title,
        type,
        triggeredAt: Date.now(),
      });
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(`Orbit: ${habit.title}`, {
            body:
              type === 'start'
                ? `Time to start ${habit.title} (${habit.start_time})`
                : `${habit.title} time is up (${habit.end_time}). Mark it complete!`,
            icon: '/vite.svg',
            tag: `orbit-${habit.id}-${type}-${Date.now()}`,
            requireInteraction: true,
          });
        } catch {
          // non-fatal
        }
      }
    },
    [stopSound]
  );

  /**
   * Called by the overlay when the user taps Stop. Stops the sound and
   * dismisses the overlay. The triggered key stays set so the alarm does
   * not re-fire for the same habit/time today.
   */
  const dismissAlarm = useCallback(() => {
    stopSound();
    setActiveAlarm(null);
  }, [stopSound]);

  /**
   * Called by the overlay when the user taps Snooze. Stops the sound,
   * hides the overlay, and schedules a re-fire after the configured snooze
   * window.
   */
  const snoozeAlarm = useCallback(() => {
    setActiveAlarm((current) => {
      if (current) {
        const settings = loadAlarmSettings();
        snoozesRef.current.set(`${current.habitId}-${current.type}`, {
          habitId: current.habitId,
          type: current.type,
          fireAt: Date.now() + settings.snoozeMinutes * 60 * 1000,
        });
      }
      return null;
    });
    stopSound();
  }, [stopSound]);

  const checkAlarms = useCallback(() => {
    const now = Date.now();
    const todayStr = new Date().toDateString();

    // Re-fire snoozed alarms whose window has elapsed.
    for (const [key, pending] of snoozesRef.current.entries()) {
      if (now >= pending.fireAt) {
        snoozesRef.current.delete(key);
        const habit = habitsRef.current.find((h) => h.id === pending.habitId);
        if (habit) {
          void fireAlarm(habit, pending.type);
        }
      }
    }

    habitsRef.current.forEach((habit) => {
      const [sh, sm] = habit.start_time.split(':').map(Number);
      const [eh, em] = habit.end_time.split(':').map(Number);

      const startTime = new Date();
      startTime.setHours(sh, sm, 0, 0);

      const endTime = new Date();
      endTime.setHours(eh, em, 0, 0);

      const startKey = `${habit.id}-start-${todayStr}`;
      const endKey = `${habit.id}-end-${todayStr}`;

      if (
        now >= startTime.getTime() &&
        now < endTime.getTime() &&
        !triggeredRef.current.has(startKey) &&
        !snoozesRef.current.has(`${habit.id}-start`)
      ) {
        triggeredRef.current.add(startKey);
        void fireAlarm(habit, 'start');
      }

      if (
        now >= endTime.getTime() &&
        !triggeredRef.current.has(endKey) &&
        !snoozesRef.current.has(`${habit.id}-end`)
      ) {
        triggeredRef.current.add(endKey);
        void fireAlarm(habit, 'end');
      }
    });
  }, [fireAlarm]);

  useEffect(() => {
    const interval = setInterval(checkAlarms, 5000);
    checkAlarms();
    return () => clearInterval(interval);
  }, [checkAlarms]);

  // Stop sound if the component unmounts while an alarm is playing.
  useEffect(() => {
    return () => stopSound();
  }, [stopSound]);

  return { activeAlarm, dismissAlarm, snoozeAlarm };
}
