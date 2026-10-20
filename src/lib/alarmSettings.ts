import type { PresetId } from './alarmSounds';

/**
 * User alarm preferences, persisted in localStorage. The selected sound is
 * either one of the built-in presets or a custom uploaded sound (referenced
 * by its IndexedDB id). gainBoost multiplies the Web Audio master gain so
 * alarms can be pushed beyond default HTML5 audio loudness.
 */

export interface AlarmSettings {
  /** 'preset' to use a built-in alarm, 'custom' to use an uploaded sound. */
  source: 'preset' | 'custom';
  presetId: PresetId;
  /** IndexedDB id of the uploaded sound when source === 'custom'. */
  customSoundId: string | null;
  /** Master gain multiplier (1.0 = no boost, up to 5.0). */
  gainBoost: number;
  /** Snooze duration in minutes when the user taps Snooze on the overlay. */
  snoozeMinutes: number;
}

const KEY = 'orbit-alarm-settings';

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  source: 'preset',
  presetId: 'digital-siren',
  customSoundId: null,
  gainBoost: 2.5,
  snoozeMinutes: 5,
};

export function loadAlarmSettings(): AlarmSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_ALARM_SETTINGS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_ALARM_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AlarmSettings>;
    return { ...DEFAULT_ALARM_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_ALARM_SETTINGS };
  }
}

export function saveAlarmSettings(settings: AlarmSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}
export async function showHabitAlarmNotification(habitTitle: string) {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;

  registration.showNotification(Habit Time Up: ${habitTitle}, {
    body: 'Time to complete your habit! Click below to control the alarm.',
    icon: '/pwa-192x192.svg',
    tag: 'habit-alarm-notification',
    requireInteraction: true,
    vibrate: [500, 250, 500, 250, 500],
    actions: [
      { action: 'stop-alarm', title: 'Stop Alarm' },
      { action: 'snooze', title: 'Snooze 5 min' },
    ],
  });
}