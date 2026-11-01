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

const TRIGGERED_PREFIX = 'orbit-alarm-triggered';

/**
 * Persist fired alarms in sessionStorage keyed by habit id + type + date so
 * a page reload or re-login never re-triggers an alarm that already fired
 * today. Returns true if the alarm has already been recorded as fired.
 */
function wasTriggered(habitId: string, type: 'start' | 'end', dateStr: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(`${TRIGGERED_PREFIX}:${habitId}:${type}:${dateStr}`) === '1';
}

function markTriggered(habitId: string, type: 'start' | 'end', dateStr: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(`${TRIGGERED_PREFIX}:${habitId}:${type}:${dateStr}`, '1');
}

export function useAlarms(habits: AlarmHabit[]) {
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);

  const snoozesRef = useRef<Map<string, PendingSnooze>>(new Map());
  const habitsRef = useRef(habits);
  const alarmHandleRef = useRef<AlarmHandle | null>(null);
  const dismissRef = useRef<() => void>(() => {});
  const snoozeRef = useRef<() => void>(() => {});

  habitsRef.current = habits;

  // Stop any playing alarm sound and clear the handle.
  const stopSound = useCallback(() => {
    if (alarmHandleRef.current) {
      alarmHandleRef.current.stop();
      alarmHandleRef.current = null;
    }
  }, []);

  // Keep dismiss/snooze refs current so the SW message handler (registered
  // once on mount) always calls the latest closures.
  // The sound keeps ringing until the user dismisses it from the overlay
  // or from the system notification action buttons.

  // Request notification permission once on mount.
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  /**
   * Fire an alarm: start the designated sound for this task and show
   * a system notification with Stop/Snooze action buttons. The sound
   * plays only the assigned track (looped) until stopped or dismissed —
   * no playlist, no overlapping streams.
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
      // Show a single notification with Stop/Snooze action buttons via
      // the Service Worker so the buttons work even when the tab is in
      // the background.
      if ('serviceWorker' in navigator && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(`Orbit: ${habit.title}`, {
            body:
              type === 'start'
                ? `Time to start ${habit.title} (${habit.start_time})`
                : `${habit.title} time is up (${habit.end_time}). Mark it complete!`,
            icon: '/pwa-192x192.svg',
            tag: `orbit-${habit.id}-${type}`,
            requireInteraction: true,
            vibrate: [500, 250, 500, 250, 500],
            actions: [
              { action: 'stop-alarm', title: 'Stop' },
              { action: 'snooze', title: `Snooze ${loadAlarmSettings().snoozeMinutes}m` },
            ],
          } as NotificationOptions);
        } catch {
          // non-fatal
        }
      }
    },
    [stopSound]
  );

  /**
   * Called by the overlay or SW handler when the user taps Stop.
   * Stops the sound and dismisses the overlay. The triggered key stays
   * set so the alarm does not re-fire for the same habit/time today.
   */
  const dismissAlarm = useCallback(() => {
    stopSound();
    setActiveAlarm(null);
  }, [stopSound]);

  /**
   * Called by the overlay or SW handler when the user taps Snooze.
   * Stops the sound, hides the overlay, and schedules a re-fire after
   * the configured snooze window.
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

  // Keep refs in sync so the global SW message listener always uses the
  // latest dismiss/snooze functions.
  dismissRef.current = dismissAlarm;
  snoozeRef.current = snoozeAlarm;

  // Register a single global listener for Service Worker messages (Stop/Snooze).
  // This runs once on mount and dispatches to the current dismiss/snooze.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STOP_ALARM') {
        dismissRef.current();
      } else if (event.data?.type === 'SNOOZE_ALARM') {
        snoozeRef.current();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  const checkAlarms = useCallback(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const curH = now.getHours();
    const curM = now.getMinutes();

    // Re-fire snoozed alarms whose window has elapsed.
    for (const [key, pending] of snoozesRef.current.entries()) {
      if (Date.now() >= pending.fireAt) {
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

      // Only fire when the current minute exactly matches the habit's
      // start or end time — not whenever now is past the scheduled time.
      const startMatches = curH === sh && curM === sm;
      const endMatches = curH === eh && curM === em;

      if (
        startMatches &&
        !wasTriggered(habit.id, 'start', todayStr) &&
        !snoozesRef.current.has(`${habit.id}-start`)
      ) {
        markTriggered(habit.id, 'start', todayStr);
        void fireAlarm(habit, 'start');
      }

      if (
        endMatches &&
        !wasTriggered(habit.id, 'end', todayStr) &&
        !snoozesRef.current.has(`${habit.id}-end`)
      ) {
        markTriggered(habit.id, 'end', todayStr);
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
