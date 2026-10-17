import { motion } from 'framer-motion';
import { Flame, TrendingUp, Target } from 'lucide-react';

interface ProgressTrackerProps {
  total: number;
  completed: number;
  streak: number;
}

export default function ProgressTracker({ total, completed, streak }: ProgressTrackerProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Completion bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:col-span-1"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-white/40">Today's Progress</span>
          <TrendingUp size={16} className="text-cyan-400" />
        </div>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{pct}%</span>
          <span className="text-xs text-white/40">{completed}/{total} done</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
          />
        </div>
      </motion.div>

      {/* Streak */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-white/40">In Orbit Streak</span>
          <Flame size={16} className="text-orange-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{streak}</span>
          <span className="text-xs text-white/40">day streak</span>
        </div>
        <p className="mt-2 text-[11px] text-orange-400/60">
          {streak > 0 ? 'Keep the orbit alive!' : 'Complete all habits today to start'}
        </p>
      </motion.div>

      {/* Active habits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-white/40">Active Habits</span>
          <Target size={16} className="text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-xs text-white/40">scheduled</span>
        </div>
        <p className="mt-2 text-[11px] text-emerald-400/60">
          {total > 0 ? 'Sequentially locked' : 'Add your first habit'}
        </p>
      </motion.div>
    </div>
  );
}
