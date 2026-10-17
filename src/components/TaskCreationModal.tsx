import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Clock, Heart, Briefcase, User, Brain } from 'lucide-react';
import type { HabitCategory } from '@/lib/types';
import { HABIT_CATEGORIES } from '@/lib/types';

interface TaskCreationModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, startTime: string, endTime: string, category: HabitCategory) => Promise<void>;
  nextPosition: number;
}

const categoryMeta: Record<HabitCategory, { icon: typeof Heart; color: string }> = {
  Health: { icon: Heart, color: 'text-rose-400' },
  Work: { icon: Briefcase, color: 'text-blue-400' },
  Personal: { icon: User, color: 'text-cyan-400' },
  Mindset: { icon: Brain, color: 'text-violet-400' },
};

export default function TaskCreationModal({
  open,
  onClose,
  onAdd,
  nextPosition,
}: TaskCreationModalProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('04:30');
  const [endTime, setEndTime] = useState('05:00');
  const [category, setCategory] = useState<HabitCategory>('Personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      setError('Please enter a habit name');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onAdd(title.trim(), startTime, endTime, category);
      setTitle('');
      setStartTime('04:30');
      setEndTime('05:00');
      setCategory('Personal');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add habit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setStartTime('04:30');
    setEndTime('05:00');
    setCategory('Personal');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1424] p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-white/30 transition-colors hover:text-white/60"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10">
                <Plus size={20} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Add New Habit</h3>
              <p className="mt-1 text-sm text-white/40">
                {nextPosition === 0 ? 'Your first habit in the sequence' : `Habit #${nextPosition + 1} in your daily sequence`}
              </p>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
                Habit Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Praying, Brushing, Meditation"
                maxLength={50}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all focus:border-cyan-400/50"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
                Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {HABIT_CATEGORIES.map((cat) => {
                  const meta = categoryMeta[cat];
                  const Icon = meta.icon;
                  const isActive = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border py-2.5 text-[10px] font-medium transition-all ${
                        isActive
                          ? 'border-cyan-400/50 bg-cyan-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70'
                      }`}
                    >
                      <Icon size={15} className={isActive ? meta.color : ''} />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Times */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-white/50">
                  <Clock size={11} /> Start
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition-all focus:border-cyan-400/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-white/50">
                  <Clock size={11} /> End
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition-all focus:border-cyan-400/50 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mb-5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <p className="text-xs text-white/40">
                Preview: <span className="font-medium text-white/70">{title || 'Your habit'}</span>
                {' — '}
                <span className="text-cyan-400/80">{formatTime(startTime)}</span>
                {' to '}
                <span className="text-cyan-400/80">{formatTime(endTime)}</span>
              </p>
            </div>

            {error && (
              <p className="mb-3 text-xs text-red-400">{error}</p>
            )}

            <button
              onClick={handleAdd}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <Plus size={18} />
                  Add Habit
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
