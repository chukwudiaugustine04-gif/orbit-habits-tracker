import { motion } from 'framer-motion';
import { Hand, History, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { HeartReading } from '@/lib/useHeartRateScan';
import type { useHeartRateScan } from '@/lib/useHeartRateScan';

type HeartHook = ReturnType<typeof useHeartRateScan>;

interface HeartHistoryPanelProps {
  heart: HeartHook;
}

function summarize(history: HeartReading[]) {
  if (history.length === 0) return null;
  const values = history.map((r) => r.bpm);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
  };
}

function formatWhen(at: number): string {
  return new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function HeartHistoryPanel({ heart }: HeartHistoryPanelProps) {
  const stats = summarize(heart.history);
  const tapping = heart.phase === 'analyzing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"
    >
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="mb-1 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10">
            <Hand size={18} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Manual Tap Measure</h2>
            <p className="text-xs text-white/40">Tap along with your heartbeat, e.g. on your wrist pulse</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <motion.button
            onClick={heart.tapBeat}
            disabled={!tapping}
            whileTap={{ scale: 0.94 }}
            className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 border-rose-400/40 bg-rose-500/15 text-white transition-colors hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="text-3xl font-bold">{tapping && heart.bpm ? heart.bpm : '--'}</span>
            <span className="text-[10px] text-white/50">bpm</span>
          </motion.button>
          <span className="mt-3 text-[11px] text-white/40">
            {tapping ? `${heart.tapCount} beat${heart.tapCount === 1 ? '' : 's'} tapped` : 'Start tap mode, then tap on each beat'}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {!tapping ? (
            <button
              onClick={heart.startTapMode}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/80 transition-all hover:text-white"
            >
              Start Tap Mode
            </button>
          ) : (
            <>
              <button
                onClick={heart.finishTap}
                className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/20"
              >
                Save Reading
              </button>
              <button
                onClick={heart.reset}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/60 transition-all hover:text-white/90"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {heart.phase === 'error' && heart.error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{heart.error}</span>
          </div>
        )}
        {heart.phase === 'done' && heart.bpm !== null && !tapping && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            <CheckCircle2 size={14} className="text-emerald-400" />
            Saved {heart.bpm} bpm to your history
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History size={16} className="text-rose-400" />
            <h2 className="text-base font-semibold text-white">Heart Rate History</h2>
          </div>
          {heart.history.length > 0 && (
            <button
              onClick={heart.clearHistory}
              className="flex items-center gap-1 text-[11px] text-white/40 transition-colors hover:text-red-400"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Min', value: stats.min },
                { label: 'Avg', value: stats.avg },
                { label: 'Max', value: stats.max },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">{item.label}</p>
                  <p className="mt-1 text-xl font-bold text-white">{item.value}</p>
                  <p className="text-[10px] text-white/30">bpm</p>
                </div>
              ))}
            </div>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {heart.history.slice(0, 20).map((reading) => (
                <li
                  key={reading.at}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                >
                  <span className="text-sm font-semibold text-white">{reading.bpm} bpm</span>
                  <span className="text-[11px] text-white/40">
                    {reading.source === 'tap' ? 'Manual' : 'Camera'} · {formatWhen(reading.at)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-white/50">No readings yet</p>
            <p className="mt-1 text-xs text-white/30">Completed camera scans and tap measurements are saved here.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
