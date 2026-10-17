import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';

interface CaptchaWidgetProps {
  onVerified: () => void;
  onReset: () => void;
}

type CaptchaState = 'idle' | 'verifying' | 'success';

export default function CaptchaWidget({ onVerified, onReset }: CaptchaWidgetProps) {
  const [state, setState] = useState<CaptchaState>('idle');
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startVerification = () => {
    if (state !== 'idle') return;
    setState('verifying');
    setProgress(0);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => {
            setState('success');
            onVerified();
          }, 200);
          return 100;
        }
        return prev + 5;
      });
    }, 45);
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState('idle');
    setProgress(0);
    onReset();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 backdrop-blur-xl transition-all duration-500 ${
        state === 'success'
          ? 'border-emerald-500/50 bg-emerald-500/[0.06] shadow-[0_0_24px_rgba(16,185,129,0.12)]'
          : state === 'verifying'
          ? 'border-cyan-400/40 bg-cyan-500/[0.04] shadow-[0_0_20px_rgba(34,211,238,0.08)]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
      }`}
    >
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />

      <div className="relative flex items-center justify-between p-4">
        {/* Left: label */}
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-white/80">I'm not a robot</p>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-white/35">
              <ShieldCheck size={11} className="text-cyan-400/50" />
              <span>Secured by Orbit Verification</span>
            </div>
          </div>
        </div>

        {/* Right: checkbox */}
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.button
                key="checkbox-idle"
                type="button"
                onClick={startVerification}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-white/25 bg-white/5 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/10"
                aria-label="Verify I am not a robot"
              >
                <div className="h-3 w-3 rounded-sm border border-white/20" />
              </motion.button>
            )}

            {state === 'verifying' && (
              <motion.div
                key="checkbox-verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-cyan-400/60 bg-cyan-500/15"
              >
                <Loader2 size={16} className="text-cyan-400 animate-spin" />
              </motion.div>
            )}

            {state === 'success' && (
              <motion.div
                key="checkbox-success"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-emerald-500 bg-emerald-500"
              >
                <Check size={18} className="text-white" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar during verifying */}
      <AnimatePresence>
        {state === 'verifying' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-[10px] text-cyan-400/60">
                Verifying you are human...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success banner */}
      <AnimatePresence>
        {state === 'success' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-1.5">
                <Check size={12} className="text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">
                  Verification Complete
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer bar */}
      <div className="relative flex items-center justify-between border-t border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
            <ShieldCheck size={12} className="text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
              Orbit
            </span>
            <span className="text-[8px] text-white/25">Privacy · Terms</span>
          </div>
        </div>

        {state === 'success' ? (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] text-white/30 transition-colors hover:text-white/60"
          >
            <RefreshCw size={10} />
            Reset
          </button>
        ) : (
          <span className="text-[10px] text-white/20">v2.0</span>
        )}
      </div>
    </div>
  );
}
