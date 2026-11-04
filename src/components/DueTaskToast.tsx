import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, CheckCircle2, AlarmClockOff, X } from 'lucide-react';
import type { DueToast } from '@/lib/useDueTaskToasts';

interface DueTaskToastProps {
  toasts: DueToast[];
  onComplete: (habitId: string) => void;
  onSnooze: (habitId: string) => void;
  onDismiss: (habitId: string) => void;
}

export default function DueTaskToast({ toasts, onComplete, onSnooze, onDismiss }: DueTaskToastProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-40 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.habitId}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            role="alert"
            className="pointer-events-auto overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl"
            style={{ borderColor: 'var(--border-active)', background: 'var(--bg-card)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}
              >
                <BellRing size={17} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  It's time to complete {toast.title}!
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Mark it done or snooze for 5 minutes.
                </p>
              </div>
              <button
                onClick={() => onDismiss(toast.habitId)}
                aria-label="Dismiss"
                className="rounded-md p-1 transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onComplete(toast.habitId)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }}
              >
                <CheckCircle2 size={14} />
                Complete
              </button>
              <button
                onClick={() => onSnooze(toast.habitId)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
                style={{ borderColor: 'var(--border-active)', color: 'var(--accent-primary)' }}
              >
                <AlarmClockOff size={14} />
                Snooze 5 min
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
