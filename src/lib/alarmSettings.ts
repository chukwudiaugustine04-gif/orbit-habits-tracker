import type { PresetId } from "./alarmSounds";
import { startAlarm, decodeCustomAudio } from "./alarmSounds";
import { getSound } from "./alarmStorage";

export interface AlarmSettings {
  source: "preset" | "custom";
  presetId: PresetId;
  customSoundId: string | null;
  gainBoost: number;
  snoozeMinutes: number;
}

export type DefaultAlertSource = 'preset' | 'custom';

export interface DefaultAlertSettings {
  source: DefaultAlertSource;
  presetId: PresetId;
  customSoundId: string | null;
}

const KEY = "orbit-alarm-settings";
const DEFAULT_ALERT_KEY = 'orbit-default-alert-settings';

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  source: "preset",
  presetId: "digital-siren",
  customSoundId: null,
  gainBoost: 2.5,
  snoozeMinutes: 5,
};

export const DEFAULT_ALERT_DEFAULTS: DefaultAlertSettings = {
  source: 'preset',
  presetId: 'gentle-wake',
  customSoundId: null,
};

export function loadDefaultAlertSettings(): DefaultAlertSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_ALERT_DEFAULTS };
  try {
    const raw = localStorage.getItem(DEFAULT_ALERT_KEY);
    if (!raw) return { ...DEFAULT_ALERT_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<DefaultAlertSettings>;
    return { ...DEFAULT_ALERT_DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULT_ALERT_DEFAULTS };
  }
}

export function saveDefaultAlertSettings(settings: DefaultAlertSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DEFAULT_ALERT_KEY, JSON.stringify(settings));
}

export function loadAlarmSettings(): AlarmSettings {
  if (typeof localStorage === "undefined") return { ...DEFAULT_ALARM_SETTINGS };
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
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}

/**
 * Play a one-shot alert chime for task reminders/popups using the Web Audio
 * engine. Returns a stop handle so callers can stop it early.
 */
export async function playDefaultAlertChime(): Promise<{ stop: () => void }> {
  const settings = loadDefaultAlertSettings();
  if (settings.source === 'custom' && settings.customSoundId) {
    try {
      const stored = await getSound(settings.customSoundId);
      if (stored) {
        const buffer = await decodeCustomAudio(stored.arrayBuffer);
        return startAlarm({ kind: 'custom', customBuffer: buffer }, 1.5);
      }
    } catch {
      // fall through to preset
    }
  }
  return startAlarm({ kind: 'preset', presetId: settings.presetId }, 1.5);
}

// Notification System Helpers
export async function initAlarmNotificationSystem() {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return false;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return false;
  }
}

export async function showHabitAlarmNotification(habitTitle: string) {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification("Habit Time Up: " + habitTitle, {
      body: "Time to complete your habit! Click below to control the alarm.",
      icon: "/pwa-192x192.svg",
      tag: "habit-alarm-notification",
      requireInteraction: true,
      vibrate: [500, 250, 500, 250, 500],
      actions: [
        { action: "stop-alarm", title: "Stop Alarm" },
        { action: "snooze", title: "Snooze 5 min" },
      ],
    } as NotificationOptions);
  } catch (err) {
    console.error("Notification error:", err);
  }
}