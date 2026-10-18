import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  CheckCircle2,
  Plus,
  Trash2,
  Bell,
  Clock,
  Play,
  Calendar,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAlarms } from '@/lib/useAlarms';
import { loadStreakData } from '@/lib/streaks';
import {
  loadHabitsWithTodayCompletion,
  logHabitCompletion,
  clearHabitCompletionToday,
  todayLocalDate,
} from '@/lib/habitDaily';
import type { Habit, HabitCategory } from '@/lib/types';
import { HABIT_CATEGORIES } from '@/lib/types';
import TaskCreationModal from './TaskCreationModal';
import ProgressTracker from './ProgressTracker';

interface TaskSchedulerProps {
  userId: string;
  userName: string;
}

// userId is not used directly — Supabase RLS uses auth.uid() automatically.
// Kept in props for interface consistency across tabs.

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function isTimeInRange(startTime: string, endTime: string): boolean {
  const now = new Date();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = new Date();
  start.setHours(sh, sm, 0, 0);
  const end = new Date();
  end.setHours(eh, em, 0, 0);
  return now >= start && now < end;
}

function isTimePast(endTime: string): boolean {
  const now = new Date();
  const [eh, em] = endTime.split(':').map(Number);
  const end = new Date();
  end.setHours(eh, em, 0, 0);
  return now >= end;
}

export default function TaskScheduler({ userId: _userId }: TaskSchedulerProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streak, setStreak] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const lastResetDate = useRef(todayLocalDate());
  const [activeCategory, setActiveCategory] = useState<HabitCategory | 'All'>('All');

  // Tick every 30s so time-based UI (active/past states) stays fresh
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeUntilReset(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Alarm hook
  useAlarms(habits.map((h) => ({
    id: h.id,
    title: h.title,
    start_time: h.start_time,
    end_time: h.end_time,
    completed: h.completed,
  })));

  // Today's completion state is derived from completion_logs (one row per
  // habit per calendar day), not from a boolean on the habit row. This means
  // habits naturally show as incomplete at the start of a new day without any
  // destructive reset — yesterday's logs remain in the database for history.
  const loadHabits = useCallback(async () => {
    const habitsWithToday = await loadHabitsWithTodayCompletion();
    setHabits(habitsWithToday);
    setLoading(false);
  }, []);

  const loadStreak = useCallback(async () => {
    // Streak is derived directly from completion_logs so it can never desync
    // from the streaks table. See src/lib/streaks.ts for the algorithm.
    const { currentStreak } = await loadStreakData();
    setStreak(currentStreak);
  }, []);

  useEffect(() => {
    loadHabits();
    loadStreak();
  }, [loadHabits, loadStreak]);

  // Daily reset at midnight — since completion state is derived from
  // completion_logs keyed by calendar date, a new day naturally shows all
  // habits as incomplete. We just reload from the logs so the UI flips over
  // at local midnight without destroying any historical data.
  const performDailyReset = useCallback(async () => {
    const today = todayLocalDate();
    if (today === lastResetDate.current) return;
    lastResetDate.current = today;

    await loadHabits();
    await loadStreak();
  }, [loadHabits, loadStreak]);

  useEffect(() => {
    const interval = setInterval(performDailyReset, 60000);
    return () => clearInterval(interval);
  }, [performDailyReset]);

  const addHabit = async (title: string, startTime: string, endTime: string, category: HabitCategory) => {
    const position = habits.length;

    const { data, error } = await supabase
      .from('habits')
      .insert({
        title,
        start_time: startTime,
        end_time: endTime,
        position,
        category,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    setHabits((prev) => [...prev, data as Habit]);
  };

  const toggleHabit = async (habit: Habit) => {
    const sortedHabits = [...habits].sort((a, b) => a.position - b.position);
    const isUnlocked = sortedHabits.every((h, i) => {
      if (i >= habit.position) return true;
      return h.completed;
    });

    if (!isUnlocked && !habit.completed) return;

    const newCompleted = !habit.completed;

    // Optimistic update — today's completion state lives in the UI only;
    // the source of truth is a completion_log row for today.
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? { ...h, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : h
      )
    );

    try {
      if (newCompleted) {
        await logHabitCompletion(habit);
      } else {
        await clearHabitCompletionToday(habit.id);
      }
    } catch (err) {
      console.error('Failed to toggle habit completion:', (err as Error).message);
      // Revert optimistic update on failure
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, completed: habit.completed, completed_at: habit.completed_at } : h
        )
      );
      return;
    }

    // Streak is derived from completion_logs, so just recompute it now.
    await loadStreak();
  };

  const deleteHabit = async (habit: Habit) => {
    // Optimistic
    setHabits((prev) => prev.filter((h) => h.id !== habit.id));

    await supabase.from('habits').delete().eq('id', habit.id);

    // Re-index positions
    const remaining = habits
      .filter((h) => h.id !== habit.id)
      .sort((a, b) => a.position - b.position);

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await supabase.from('habits').update({ position: i }).eq('id', remaining[i].id);
      }
    }

    setHabits(remaining.map((h, i) => ({ ...h, position: i })));
  };

  const sortedHabits = [...habits].sort((a, b) => a.position - b.position);
  const completedCount = sortedHabits.filter((h) => h.completed).length;
  const visibleHabits = activeCategory === 'All'
    ? sortedHabits
    : sortedHabits.filter((h) => (h.category || 'Personal') === activeCategory);

  const isHabitUnlocked = (habit: Habit): boolean => {
    return sortedHabits.every((h, i) => {
      if (i >= habit.position) return true;
      return h.completed;
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Sequential Habit Scheduler</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/40">
            <Calendar size={13} />
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
        >
          <Plus size={18} />
          Add Habit
        </button>
      </motion.div>

      {/* Daily reset timer */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center justify-between rounded-xl border px-5 py-3"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-2.5">
          <Timer size={15} style={{ color: 'var(--accent-primary)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Daily reset in
          </span>
          <span className="font-mono text-sm font-bold tabular-nums" style={{ color: 'var(--accent-primary)' }}>
            {timeUntilReset}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={11} />
          Habits auto-unlock at midnight
        </div>
      </motion.div>

      {/* Progress tracker */}
      <div className="mb-8">
        <ProgressTracker
          total={sortedHabits.length}
          completed={completedCount}
          streak={streak}
        />
      </div>

      {/* Category filters */}
      {sortedHabits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            onClick={() => setActiveCategory('All')}
            className={`flex-shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeCategory === 'All'
                ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300'
                : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70'
            }`}
          >
            All
          </button>
          {HABIT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      )}

      {/* Habits list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Today's Sequence</h2>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Bell size={13} className="text-cyan-400/60" />
            Alarms active
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          </div>
        ) : sortedHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Plus size={28} className="text-white/30" />
            </div>
            <h3 className="text-sm font-medium text-white/60">No habits yet</h3>
            <p className="mt-1 text-xs text-white/30">
              Add your first habit to start building your daily sequence
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-300 transition-all hover:bg-cyan-500/20"
            >
              <Plus size={14} />
              Add First Habit
            </button>
          </div>
        ) : visibleHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-white/40">No habits in this category</p>
            <button
              onClick={() => setActiveCategory('All')}
              className="mt-3 text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Show all habits
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {visibleHabits.map((habit, idx) => {
                const unlocked = isHabitUnlocked(habit);
                const isActive = isTimeInRange(habit.start_time, habit.end_time);
                const isPast = isTimePast(habit.end_time);
                const habitCategory = habit.category || 'Personal';

                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group relative flex items-center gap-4 rounded-xl border p-4 transition-all ${
                      habit.completed
                        ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
                        : unlocked
                        ? isActive
                          ? 'border-cyan-400/30 bg-cyan-500/[0.06] shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        : 'border-white/5 bg-white/[0.01] opacity-60'
                    }`}
                  >
                    {/* Position number */}
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                        habit.completed
                          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                          : unlocked
                          ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
                          : 'border-white/10 bg-white/5 text-white/30'
                      }`}
                    >
                      {habit.completed ? (
                        <CheckCircle2 size={18} />
                      ) : unlocked ? (
                        idx + 1
                      ) : (
                        <Lock size={16} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium truncate ${
                            habit.completed
                              ? 'text-white/50 line-through'
                              : unlocked
                              ? 'text-white'
                              : 'text-white/40'
                          }`}
                        >
                          {habit.title}
                        </span>
                        <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-medium ${
                          habitCategory === 'Health' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                          : habitCategory === 'Work' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                          : habitCategory === 'Mindset' ? 'border-violet-500/20 bg-violet-500/10 text-violet-400'
                          : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
                        }`}>
                          {habitCategory}
                        </span>
                        {isActive && !habit.completed && (
                          <span className="flex flex-shrink-0 items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            Active
                          </span>
                        )}
                        {isPast && !habit.completed && (
                          <span className="flex-shrink-0 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <Clock size={11} className="text-white/30" />
                        <span className="text-white/50">
                          {formatTime12(habit.start_time)} — {formatTime12(habit.end_time)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {unlocked && !habit.completed && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleHabit(habit)}
                          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 transition-all hover:bg-cyan-500/20"
                        >
                          <Play size={13} />
                          Complete
                        </motion.button>
                      )}
                      {habit.completed && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleHabit(habit)}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition-all hover:bg-emerald-500/20"
                        >
                          <CheckCircle2 size={13} />
                          Done
                        </motion.button>
                      )}
                      {!unlocked && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/30">
                          <Lock size={13} />
                          Locked
                        </div>
                      )}
                      <button
                        onClick={() => deleteHabit(habit)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 transition-all hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Delete habit"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Sequential hint */}
        {sortedHabits.length > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-center">
            <Lock size={13} className="text-white/30" />
            <span className="text-xs text-white/30">
              Habits unlock sequentially — complete each one to unlock the next
            </span>
          </div>
        )}
      </motion.div>

      <TaskCreationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addHabit}
        nextPosition={habits.length}
      />
    </div>
  );
}
