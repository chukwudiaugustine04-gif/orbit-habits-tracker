import type { PresetId } from './alarmSounds';

export interface AlarmSettings {
  source: 'preset' | 'custom';
  presetId: PresetId;
  customSoundId: string | null;
  gainBoost: number;
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

// Notification System Helpers
export async function initAlarmNotificationSystem() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
}

export async function showHabitAlarmNotification(habitTitle: string) {
  if (!('serviceWorker' in navigator)) return;
  try {
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
  } catch (err) {
    console.error('Notification error:', err);
  }
}