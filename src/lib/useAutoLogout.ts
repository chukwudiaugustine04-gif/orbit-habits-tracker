import { useEffect, useRef, useCallback } from 'react';

export type AutoLogoutMinutes = 5 | 10 | 15 | 30 | 0;

export const AUTO_LOGOUT_KEY = 'orbit-auto-logout-minutes';

export const AUTO_LOGOUT_OPTIONS: { value: AutoLogoutMinutes; label: string }[] = [
  { value: 5, label: '5 Minutes' },
  { value: 10, label: '10 Minutes' },
  { value: 15, label: '15 Minutes' },
  { value: 30, label: '30 Minutes' },
  { value: 0, label: 'Never (Keep me signed in)' },
];

export function loadAutoLogoutMinutes(): AutoLogoutMinutes {
  try {
    const raw = localStorage.getItem(AUTO_LOGOUT_KEY);
    if (!raw) return 0;
    const val = parseInt(raw, 10);
    if (val === 5 || val === 10 || val === 15 || val === 30 || val === 0) return val;
    return 0;
  } catch {
    return 0;
  }
}

export function saveAutoLogoutMinutes(minutes: AutoLogoutMinutes): void {
  localStorage.setItem(AUTO_LOGOUT_KEY, String(minutes));
}

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'click',
];

export function useAutoLogout(isActive: boolean, onTimeout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    const minutes = loadAutoLogoutMinutes();
    if (minutes === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, minutes * 60 * 1000);
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (loadAutoLogoutMinutes() === 0) return;

    resetTimer();

    const handleActivity = () => resetTimer();
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, handleActivity);
      }
    };
  }, [isActive, resetTimer]);
}
