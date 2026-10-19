import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Footprints,
  HeartPulse,
  Camera,
  Activity,
  Target,
  CheckCircle2,
  Play,
  Square,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { loadHabitsWithTodayCompletion, logHabitCompletion } from '@/lib/habitDaily';
import { useStepTracker } from '@/lib/useStepTracker';
import { useHeartRateScan } from '@/lib/useHeartRateScan';
import type { Habit } from '@/lib/types';

const STEP_TARGET_KEY = 'orbit-step-target';
const LAST_BPM_KEY = 'orbit-last-bpm';
const LAST_STEPS_KEY = 'orbit-last-steps';
const DEFAULT_STEP_TARGET = 5000;

interface HealthHubProps {
  userName: string;
}

export default function HealthHub({ userName: _userName }: HealthHubProps) {
  const step = useStepTracker();
  const heart = useHeartRateScan();

  const [healthHabits, setHealthHabits] = useState<Habit[]>([]);
  const [stepTarget, setStepTarget] = useState<number>(() => {
    const saved = Number(localStorage.getItem(STEP_TARGET_KEY));
    return saved > 0 ? saved : DEFAULT_STEP_TARGET;
  });
  const [autoCompletedIds, setAutoCompletedIds] = useState<Set<string>>(new Set());
  const [lastBpm, setLastBpm] = useState<number | null>(() => {
    const saved = Number(localStorage.getItem(LAST_BPM_KEY));
    return saved > 0 ? saved : null;
  });

  const autoCompletedRef = useRef<Set<string>>(new Set());
  const targetMetRef = useRef(false);

  const loadHealthHabits = useCallback(async () => {
    const all = await loadHabitsWithTodayCompletion();
    setHealthHabits(all.filter((h) => (h.category || 'Personal') === 'Health'));
  }, []);

  useEffect(() => {
    loadHealthHabits();
  }, [loadHealthHabits]);

  // Persist step target whenever it changes.
  useEffect(() => {
    localStorage.setItem(STEP_TARGET_KEY, String(stepTarget));
  }, [stepTarget]);

  // Persist latest BPM + steps for cross-session display.
  useEffect(() => {
    if (heart.bpm && heart.bpm > 0) {
      localStorage.setItem(LAST_BPM_KEY, String(heart.bpm));
      setLastBpm(heart.bpm);
    }
  }, [heart.bpm]);

  useEffect(() => {
    if (step.steps > 0) {
      localStorage.setItem(LAST_STEPS_KEY, String(step.steps));
    }
  }, [step.steps]);

  // Auto-complete health habits when the step target is met. Each habit is
  // logged only once per session so toggling off in the Scheduler still
  // respects the user's manual change for the rest of the day.
  useEffect(() => {
    if (step.steps < stepTarget || targetMetRef.current) return;
    targetMetRef.current = true;

    (async () => {
      for (const habit of healthHabits) {
        if (habit.completed) continue;
        if (autoCompletedRef.current.has(habit.id)) continue;
        autoCompletedRef.current.add(habit.id);
        try {
          await logHabitCompletion(habit);
          setAutoCompletedIds((prev) => new Set(prev).add(habit.id));
        } catch {
          autoCompletedRef.current.delete(habit.id);
        }
      }
      await loadHealthHabits();
    })();
  }, [step.steps, stepTarget, healthHabits, loadHealthHabits]);

  const stepPct = Math.min(100, Math.round((step.steps / stepTarget) * 100));
  const targetMet = step.steps >= stepTarget;
  const completedCount = healthHabits.filter((h) => h.completed).length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white">Health Tracking</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/40">
          <Activity size={13} />
          Measure steps and heart rate directly on your phone — no wearable needed
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Step Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
              <Footprints size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Step Tracker</h2>
              <p className="text-xs text-white/40">Accelerometer-based real-time counting</p>
            </div>
          </div>

          {/* Step ring */}
          <div className="mt-6 flex flex-col items-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#stepGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - stepPct / 100) }}
                  transition={{ duration: 0.5 }}
                />
                <defs>
                  <linearGradient id="stepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <motion.span
                  key={step.steps}
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-white"
                >
                  {step.steps.toLocaleString()}
                </motion.span>
                <span className="text-xs text-white/40">of {stepTarget.toLocaleString()} steps</span>
              </div>
            </div>

            {/* Intensity bar */}
            <div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                animate={{ width: `${Math.min(100, step.intensity * 60)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="mt-1 text-[10px] text-white/30">motion intensity</span>
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!step.active ? (
              <button
                onClick={step.requestPermissionAndStart}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
              >
                <Play size={14} className="fill-current" />
                Start Step Tracking
              </button>
            ) : (
              <button
                onClick={step.stop}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/20"
              >
                <Square size={14} className="fill-current" />
                Stop Tracking
              </button>
            )}
            <button
              onClick={step.reset}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/60 transition-all hover:text-white/90"
            >
              <RefreshCw size={13} />
              Reset
            </button>
          </div>

          {/* Permission status */}
          <AnimatePresence>
            {step.permission === 'denied' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Motion access was denied. Enable motion sensor permission in your browser settings to count steps.</span>
                </div>
              </motion.div>
            )}
            {step.permission === 'unsupported' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex items-start gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2.5 text-xs text-orange-400">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>This device/browser doesn't expose motion sensors. Open Orbit on a mobile phone to track steps.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Target setter */}
          <div className="mt-5 rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={13} className="text-cyan-400" />
                <span className="text-xs font-medium text-white/70">Daily Step Target</span>
              </div>
              <span className="text-xs font-semibold text-cyan-300">{stepTarget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={15000}
              step={500}
              value={stepTarget}
              onChange={(e) => {
                setStepTarget(Number(e.target.value));
                targetMetRef.current = step.steps >= Number(e.target.value);
              }}
              className="w-full accent-cyan-400"
            />
            <div className="mt-1 flex justify-between text-[10px] text-white/30">
              <span>1k</span>
              <span>15k</span>
            </div>
            {targetMet && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Target reached — health habits auto-completed!</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Heart Rate Scanner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
              <HeartPulse size={18} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Finger Camera Scan</h2>
              <p className="text-xs text-white/40">10-second PPG heart-rate measurement</p>
            </div>
          </div>

          {/* BPM display */}
          <div className="mt-6 flex flex-col items-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: 'rgba(239,68,68,0.3)' }}
                animate={
                  heart.phase === 'scanning'
                    ? { scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }
                    : { scale: 1, opacity: 0.3 }
                }
                transition={{ duration: heart.phase === 'scanning' ? 1 : 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="absolute flex flex-col items-center">
                <motion.span
                  key={heart.bpm ?? heart.phase}
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-bold text-white"
                >
                  {heart.bpm ?? (heart.phase === 'scanning' ? '…' : lastBpm ?? '--')}
                </motion.span>
                <span className="text-xs text-white/40">bpm</span>
              </div>
            </div>

            {/* Scanning progress */}
            <div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400"
                animate={{ width: `${heart.progress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="mt-1 text-[10px] text-white/30">
              {heart.phase === 'scanning'
                ? `Scanning… ${Math.round(heart.progress * 10)}s / 10s`
                : heart.phase === 'done'
                ? 'Scan complete'
                : heart.phase === 'requesting'
                ? 'Requesting camera…'
                : 'Place finger over rear camera + flash'}
            </span>
          </div>

          {/* Hidden video element used by the hook for camera capture */}
          <video ref={heart.videoRef} className="hidden" playsInline muted />

          {/* Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {heart.phase !== 'scanning' && heart.phase !== 'requesting' ? (
              <button
                onClick={heart.startScan}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/30"
              >
                <Camera size={14} />
                {heart.phase === 'done' ? 'Scan Again' : 'Start Heart-Rate Scan'}
              </button>
            ) : (
              <button
                onClick={heart.cancelScan}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/70 transition-all hover:text-white"
              >
                <Square size={14} className="fill-current" />
                Cancel
              </button>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {heart.phase === 'error' && heart.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{heart.error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result banner */}
          <AnimatePresence>
            {heart.phase === 'done' && heart.bpm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2"
              >
                <HeartPulse size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">
                  Measured {heart.bpm} bpm — saved to your health history
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Health habits auto-completion panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Health Habits</h2>
          </div>
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300">
            {completedCount}/{healthHabits.length} done today
          </span>
        </div>

        {healthHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Smartphone size={20} className="text-white/30" />
            </div>
            <p className="text-sm text-white/50">No health habits yet</p>
            <p className="mt-1 text-xs text-white/30">
              Add a habit in the Scheduler with the "Health" category, and it will auto-complete when you hit your step target.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {healthHabits.map((habit) => {
              const autoDone = autoCompletedIds.has(habit.id);
              return (
                <div
                  key={habit.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                    habit.completed
                      ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      habit.completed
                        ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                        : 'border border-white/10 bg-white/5 text-white/30'
                    }`}
                  >
                    {habit.completed ? <CheckCircle2 size={16} /> : <Activity size={15} />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${habit.completed ? 'text-white/60 line-through' : 'text-white'}`}>
                      {habit.title}
                    </span>
                    {autoDone && (
                      <span className="ml-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-medium text-cyan-300">
                        Auto-completed
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/40">
                    {habit.start_time} – {habit.end_time}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5">
          <Target size={12} className="text-white/30" />
          <span className="text-[11px] text-white/30">
            Health habits auto-complete when you reach {stepTarget.toLocaleString()} steps. Manually toggling a habit in the Scheduler always overrides this.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
