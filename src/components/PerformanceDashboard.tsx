import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  Target,
  Calendar,
  Award,
  Activity,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Plus,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { computeStreakFromLogs } from '@/lib/streaks';
import type { Habit } from '@/lib/types';

interface PerformanceDashboardProps {
  userName: string;
}

interface CompletionLog {
  id: string;
  habit_id: string | null;
  habit_title: string;
  completed_date: string;
  completed_at: string;
  day_of_week: number;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const chartColors = {
  cyan: '#22d3ee',
  emerald: '#34d399',
  orange: '#fb923c',
  blue: '#60a5fa',
  purple: '#c084fc',
  pink: '#f472b6',
};

const pieColors = [chartColors.cyan, chartColors.emerald, chartColors.orange, chartColors.blue, chartColors.purple];

function generateDemoData(): {
  weekly: { day: string; completed: number; total: number }[];
  monthly: { week: string; completion: number }[];
  habitHistory: { date: string; completed: number }[];
} {
  const weekly = dayNames.map((day, i) => ({
    day,
    completed: i === 0 ? 2 : i === 6 ? 3 : Math.floor(Math.random() * 4) + 2,
    total: 5,
  }));

  const monthly = Array.from({ length: 4 }, (_, i) => ({
    week: `Week ${i + 1}`,
    completion: Math.floor(Math.random() * 30) + 60,
  }));

  const habitHistory = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      completed: Math.floor(Math.random() * 4) + 1,
    };
  });

  return { weekly, monthly, habitHistory };
}

export default function PerformanceDashboard({ userName }: PerformanceDashboardProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completionLogs, setCompletionLogs] = useState<CompletionLog[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [retroHabitIds, setRetroHabitIds] = useState<Set<string>>(new Set());

  const reloadLogs = useCallback(async () => {
    const { data } = await supabase
      .from('completion_logs')
      .select('*')
      .order('completed_at', { ascending: false });
    setCompletionLogs((data as CompletionLog[]) || []);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').order('position', { ascending: true }),
        supabase
          .from('completion_logs')
          .select('*')
          .order('completed_at', { ascending: false }),
      ]);

      const loadedHabits = (habitsRes.data as Habit[]) || [];
      const loadedLogs = (logsRes.data as CompletionLog[]) || [];
      setHabits(loadedHabits);
      setCompletionLogs(loadedLogs);
      // Streak derives directly from completion_logs — no streaks table read.
      setStreak(computeStreakFromLogs(loadedHabits, loadedLogs.map((l) => l.completed_date)));
      setLoading(false);
    };

    loadData();
  }, []);

  // When a date is selected, load which habits were completed on that date
  useEffect(() => {
    if (!selectedDate) {
      setRetroHabitIds(new Set());
      return;
    }
    const dayLogs = completionLogs.filter(
      (log) => new Date(log.completed_date).toDateString() === new Date(selectedDate).toDateString()
    );
    setRetroHabitIds(new Set(dayLogs.map((l) => l.habit_id).filter(Boolean) as string[]));
  }, [selectedDate, completionLogs]);

  const handleRetroToggle = async (habit: Habit) => {
    if (!selectedDate) return;
    const dateStr = selectedDate; // already YYYY-MM-DD
    const isCompleted = retroHabitIds.has(habit.id);

    if (isCompleted) {
      // Remove the completion log for this habit on this date
      await supabase
        .from('completion_logs')
        .delete()
        .eq('habit_id', habit.id)
        .eq('completed_date', dateStr);
      setRetroHabitIds((prev) => { const n = new Set(prev); n.delete(habit.id); return n; });
    } else {
      // Add a completion log for this habit on this date
      const logDate = new Date(dateStr);
      await supabase.from('completion_logs').insert({
        habit_id: habit.id,
        habit_title: habit.title,
        completed_date: dateStr,
        completed_at: logDate.toISOString(),
        day_of_week: logDate.getDay(),
      });
      setRetroHabitIds((prev) => { const n = new Set(prev); n.add(habit.id); return n; });
    }

    // Reload logs so charts update
    await reloadLogs();
    // Recompute derived streak after logs change
    const { data: freshHabits } = await supabase.from('habits').select('*');
    const h = (freshHabits as Habit[]) || [];
    setHabits(h);
  };

  const demo = useMemo(() => generateDemoData(), []);

  // Build analytics from real data where available, fall back to demo
  const analytics = useMemo(() => {
    const todayStr = new Date().toDateString();

    // Weekly consistency — last 7 days
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toDateString();
      const dayLogs = completionLogs.filter(
        (log) => new Date(log.completed_date).toDateString() === dateStr
      );
      return {
        day: dayNames[d.getDay()],
        completed: dayLogs.length,
        total: habits.length || 5,
      };
    });

    // If no real data, use demo
    const hasRealData = completionLogs.length > 0;
    const weekly = hasRealData ? weeklyData : demo.weekly;

    // Monthly completion — last 4 weeks
    const monthlyData = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (3 - i) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekLogs = completionLogs.filter((log) => {
        const logDate = new Date(log.completed_date);
        return logDate >= weekStart && logDate < weekEnd;
      });

      const totalPossible = (habits.length || 5) * 7;
      const pct = totalPossible > 0 ? Math.round((weekLogs.length / totalPossible) * 100) : 0;
      return {
        week: `Week ${i + 1}`,
        completion: hasRealData ? Math.min(pct, 100) : demo.monthly[i].completion,
      };
    });

    // Habit history — last 14 days completion count
    const historyData = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toDateString();
      const dayLogs = completionLogs.filter(
        (log) => new Date(log.completed_date).toDateString() === dateStr
      );
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        completed: hasRealData ? dayLogs.length : demo.habitHistory[i].completed,
      };
    });

    // Per-habit breakdown for pie chart
    const habitBreakdown = habits.length > 0
      ? habits.map((h, i) => ({
          name: h.title,
          value: completionLogs.filter((log) => log.habit_id === h.id).length || 1,
          color: pieColors[i % pieColors.length],
        }))
      : demo.weekly.map((w, i) => ({
          name: `Habit ${i + 1}`,
          value: w.completed,
          color: pieColors[i % pieColors.length],
        }));

    // Today's stats
    const todayLogs = completionLogs.filter(
      (log) => new Date(log.completed_date).toDateString() === todayStr
    );
    const todayCompletion = habits.length > 0
      ? Math.round((todayLogs.length / habits.length) * 100)
      : 0;

    // Total completions all time
    const totalCompletions = completionLogs.length || demo.habitHistory.reduce((a, b) => a + b.completed, 0);

    // Best day
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    completionLogs.forEach((log) => {
      if (log.day_of_week >= 0 && log.day_of_week <= 6) dayCounts[log.day_of_week]++;
    });
    const bestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
    const bestDay = dayCounts.some((c) => c > 0) ? dayNames[bestDayIdx] : 'Mon';

    return {
      weekly,
      monthly: monthlyData,
      habitHistory: historyData,
      habitBreakdown,
      todayCompletion,
      totalCompletions,
      bestDay,
    };
  }, [habits, completionLogs, demo]);

  const firstName = userName.split(' ')[0] || 'there';

  const stats = [
    {
      label: "Today's Completion",
      value: `${analytics.todayCompletion}%`,
      icon: TrendingUp,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20',
    },
    {
      label: 'In Orbit Streak',
      value: `${streak} days`,
      icon: Flame,
      color: 'text-orange-400',
      border: 'border-orange-500/20',
    },
    {
      label: 'Total Completions',
      value: `${analytics.totalCompletions}`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Best Day',
      value: analytics.bestDay,
      icon: Award,
      color: 'text-blue-400',
      border: 'border-blue-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/40">
          <Activity size={13} />
          {firstName}, here's your habit performance across time
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className={`rounded-xl border ${stat.border} bg-white/[0.03] p-5 backdrop-blur-xl`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-white/40">
                {stat.label}
              </span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <span className="text-2xl font-bold text-white">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Calendar Date Selector & History Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-white">History Calendar & Retroactive Log</h2>
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
          {/* Calendar */}
          <div className="mx-auto w-full max-w-[320px]">
            {/* Month navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setCalMonth((p) => {
                  const d = new Date(p.year, p.month - 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:bg-white/10"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-white">
                {monthNames[calMonth.month]} {calMonth.year}
              </span>
              <button
                onClick={() => setCalMonth((p) => {
                  const d = new Date(p.year, p.month + 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:bg-white/10"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium uppercase text-white/30">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
                const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
                const todayStr = new Date().toDateString();
                const cells: React.ReactNode[] = [];

                // Empty cells before the 1st
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} />);
                }

                for (let day = 1; day <= daysInMonth; day++) {
                  const dateObj = new Date(calMonth.year, calMonth.month, day);
                  const dateStr = `${calMonth.year}-${(calMonth.month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const isToday = dateObj.toDateString() === todayStr;
                  const isFuture = dateObj > new Date(todayStr);
                  const isSelected = selectedDate === dateStr;
                  const dayLogs = completionLogs.filter(
                    (log) => new Date(log.completed_date).toDateString() === dateObj.toDateString()
                  );
                  const completedCount = dayLogs.length;

                  cells.push(
                    <button
                      key={day}
                      onClick={() => !isFuture && setSelectedDate(dateStr)}
                      disabled={isFuture}
                      className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20'
                          : isToday
                          ? 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
                          : isFuture
                          ? 'cursor-not-allowed text-white/15'
                          : completedCount > 0
                          ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          : 'text-white/50 hover:bg-white/5'
                      }`}
                    >
                      {day}
                      {completedCount > 0 && !isSelected && (
                        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>
          </div>

          {/* Selected date details */}
          <div>
            {selectedDate ? (
              <div>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-white">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {retroHabitIds.size} of {habits.length} habits completed
                  </p>
                </div>

                <div className="space-y-2">
                  {habits.length === 0 ? (
                    <p className="text-xs text-white/30">No habits created yet. Add habits in the Scheduler tab.</p>
                  ) : (
                    habits.map((habit) => {
                      const isDone = retroHabitIds.has(habit.id);
                      return (
                        <button
                          key={habit.id}
                          onClick={() => handleRetroToggle(habit)}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                            isDone
                              ? 'border-emerald-500/20 bg-emerald-500/[0.06]'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-md border transition-all ${
                              isDone
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-white/20 bg-white/5'
                            }`}
                          >
                            {isDone && <CheckCircle2 size={16} className="text-white" />}
                            {!isDone && <Plus size={14} className="text-white/30" />}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              isDone ? 'text-white/50 line-through' : 'text-white/80'
                            }`}
                          >
                            {habit.title}
                          </span>
                          <span className="ml-auto text-[10px] text-white/30">
                            {habit.start_time} — {habit.end_time}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
                <Calendar size={32} className="mb-3 text-white/20" />
                <p className="text-sm font-medium text-white/40">Select a date</p>
                <p className="mt-1 text-xs text-white/25">
                  Click any past date to review or retroactively check off habits
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Habit History — Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Habit History</h2>
          </div>
          <p className="mb-4 text-xs text-white/40">Daily completions over the last 14 days</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analytics.habitHistory}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.cyan} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColors.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1424',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke={chartColors.cyan}
                strokeWidth={2}
                fill="url(#colorCompleted)"
                name="Habits completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weekly Consistency — Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-2">
            <Target size={16} className="text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Weekly Consistency</h2>
          </div>
          <p className="mb-4 text-xs text-white/40">Habit completions by day of week</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1424',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar
                dataKey="completed"
                fill={chartColors.emerald}
                radius={[6, 6, 0, 0]}
                name="Completed"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Completion Logs — Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.49 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-400" />
            <h2 className="text-base font-semibold text-white">Monthly Completion Logs</h2>
          </div>
          <p className="mb-4 text-xs text-white/40">Completion percentage over recent weeks</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="week"
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1424',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
              />
              <Line
                type="monotone"
                dataKey="completion"
                stroke={chartColors.orange}
                strokeWidth={3}
                dot={{ fill: chartColors.orange, r: 4 }}
                activeDot={{ r: 6 }}
                name="Completion %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Habit Breakdown — Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            <h2 className="text-base font-semibold text-white">Habit Breakdown</h2>
          </div>
          <p className="mb-4 text-xs text-white/40">Completion distribution across habits</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.habitBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {analytics.habitBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="rgba(0,0,0,0)"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1424',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {analytics.habitBreakdown.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-3 w-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="flex-1 truncate text-white/70">{entry.name}</span>
                  <span className="text-white/40">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-white/30"
      >
        <Activity size={12} />
        Data synced from your Orbit cloud database — updated across all devices
      </motion.p>
    </div>
  );
}
