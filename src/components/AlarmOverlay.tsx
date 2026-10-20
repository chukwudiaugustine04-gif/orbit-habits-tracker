import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Hand, Square } from 'lucide-react';
import type { ActiveAlarm } from '@/lib/useAlarms';
import { loadAlarmSettings } from '@/lib/alarmSettings';
import { showHabitAlarmNotification } from '../lib/alarmSettings';

interface AlarmOverlayProps {
  alarm: ActiveAlarm;
  onDismiss: () => void;
  onSnooze: () => void;
}

export default function AlarmOverlay({ alarm, onDismiss, onSnooze }: AlarmOverlayProps) {
  const [snoozeMinutes] = useState(() => loadAlarmSettings().snoozeMinutes);

  // Keep the alarm focused and hard to escape — any key dismisses only on
  // Escape (Stop) or Space (Snooze). The alarm keeps ringing until then.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        onSnooze();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss, onSnooze]);
// Trigger system notification when alarm opens
  useEffect(() => {
    if (alarm?.habitTitle) {
      showHabitAlarmNotification(alarm.habitTitle);
    }
  }, [alarm?.habitTitle]);

  // Listen for actions clicked in the Notification Shade (Stop / Snooze)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STOP_ALARM') {
        onDismiss();
      } else if (event.data?.type === 'SNOOZE_ALARM') {
        onSnooze();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [onDismiss, onSnooze]);  
  useEffect(() => {
    if (alarm?.habitTitle) {
      showHabitAlarmNotification(alarm.habitTitle);
    }
  }, [alarm?.habitTitle]);

  // Listen for actions clicked in the Notification Shade (Stop / Snooze)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STOP_ALARM') {
        onDismiss();
      } else if (event.data?.type === 'SNOOZE_ALARM') {
        onSnooze();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [onDismiss, onSnooze]);
  const timeStr = new Date(alarm.triggeredAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
    >
      {/* Pulsing alert rings */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.3, 1], opacity: [0.18, 0.04, 0.18] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="h-72 w-72 rounded-full border-2 border-red-500/60" />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.55, 1], opacity: [0.12, 0.02, 0.12] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      >
        <div className="h-72 w-72 rounded-full border-2 border-amber-500/50" />
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="relative z-10 mx-6 w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0e1a]/80 p-8 text-center shadow-2xl"
      >
        {/* Pulsing bell icon */}
        <motion.div
          animate={{ rotate: [0, -14, 14, -10, 10, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.4 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 shadow-lg shadow-red-500/30"
        >
          <Bell size={38} className="text-white" />
        </motion.div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
          {alarm.type === 'start' ? 'Habit Starting' : 'Habit Time Up'}
        </p>
        <h2 className="mt-3 text-3xl font-bold text-white">{alarm.habitTitle}</h2>
        <p className="mt-2 text-sm text-white/50">Triggered at {timeStr}</p>

        <div className="mt-8 flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDismiss}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-red-500/30 transition-all hover:shadow-red-500/50"
          >
            <Square size={18} className="fill-current" />
            Stop Alarm
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSnooze}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white/80 transition-all hover:bg-white/10"
          >
            <Hand size={18} />
            Snooze {snoozeMinutes} min
          </motion.button>
        </div>

        <p className="mt-5 text-[11px] text-white/30">
          Press <span className="font-semibold text-white/50">Esc</span> to stop · <span className="font-semibold text-white/50">Space</span> to snooze
        </p>
      </motion.div>
    </motion.div>
  );
}
