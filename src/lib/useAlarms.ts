import { useCallback, useEffect, useRef } from 'react';

type AlarmType = 'start' | 'end';

interface AlarmEntry {
  habitId: string;
  habitTitle: string;
  type: AlarmType;
  time: number; // timestamp ms
}

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const notes = [880, 1108.73, 1318.51];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const start = ctx.currentTime + i * 0.15;
    const dur = 0.4;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + dur);
  });
}

function sendNotification(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/vite.svg',
        tag: `orbit-${Date.now()}`,
      });
    } catch {
      // notification creation can fail if page is not focused in some browsers
    }
  }
}

export function useAlarms(habits: { id: string; title: string; start_time: string; end_time: string; completed: boolean }[]) {
  const triggeredRef = useRef<Set<string>>(new Set());
  const habitsRef = useRef(habits);

  habitsRef.current = habits;

  // Request notification permission once
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Reset triggered set when habits change (e.g. new day)
  useEffect(() => {
    triggeredRef.current = new Set();
  }, [habits.length]);

  const checkAlarms = useCallback(() => {
    const now = Date.now();
    const todayStr = new Date().toDateString();

    habitsRef.current.forEach((habit) => {
      const [sh, sm] = habit.start_time.split(':').map(Number);
      const [eh, em] = habit.end_time.split(':').map(Number);

      const startTime = new Date();
      startTime.setHours(sh, sm, 0, 0);

      const endTime = new Date();
      endTime.setHours(eh, em, 0, 0);

      const startKey = `${habit.id}-start-${todayStr}`;
      const endKey = `${habit.id}-end-${todayStr}`;

      if (now >= startTime.getTime() && now < endTime.getTime() && !triggeredRef.current.has(startKey)) {
        triggeredRef.current.add(startKey);
        playChime();
        sendNotification(
          `Orbit: ${habit.title}`,
          `Time to start ${habit.title} (${habit.start_time})`
        );
      }

      if (now >= endTime.getTime() && !triggeredRef.current.has(endKey)) {
        triggeredRef.current.add(endKey);
        playChime();
        sendNotification(
          `Orbit: ${habit.title}`,
          `${habit.title} time is up (${habit.end_time}). Mark it complete!`
        );
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(checkAlarms, 5000);
    checkAlarms();
    return () => clearInterval(interval);
  }, [checkAlarms]);
}

export { playChime, sendNotification };
