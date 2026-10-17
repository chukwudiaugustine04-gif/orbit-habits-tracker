import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  UserCircle2,
  Trophy,
  Check,
  Lock,
  Sparkles,
  Orbit as OrbitIcon,
  Github,
  Twitter,
  Mail,
  ImageIcon,
  Upload,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  themes,
  applyTheme,
  generateThemeFromImage,
  saveCustomTheme,
  loadCustomTheme,
  clearCustomTheme,
  type ThemeId,
  type Theme,
} from '@/lib/themes';
import { avatars, badges, tierColors } from '@/lib/cosmetics';
import { supabase } from '@/lib/supabase';
import { computeStreakFromLogs } from '@/lib/streaks';
import type { Habit } from '@/lib/types';

interface ThemeSettingsProps {
  userName: string;
}

const THEME_KEY = 'orbit-theme';
const AVATAR_KEY = 'orbit-avatar';
const CUSTOM_AVATAR_KEY = 'orbit-custom-avatar';

function loadTheme(): ThemeId {
  const saved = localStorage.getItem(THEME_KEY) as ThemeId | null;
  if (saved) {
    applyTheme(saved);
    return saved;
  }
  applyTheme('dark-space');
  return 'dark-space';
}

function loadAvatar(): string {
  return localStorage.getItem(AVATAR_KEY) || 'monk';
}

function loadCustomAvatar(): string | null {
  return localStorage.getItem(CUSTOM_AVATAR_KEY);
}

export default function ThemeSettings({ userName }: ThemeSettingsProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeId>('dark-space');
  const [activeAvatar, setActiveAvatar] = useState('monk');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);

  // Custom theme generator state
  const [customTheme, setCustomTheme] = useState<Theme | null>(null);
  const [generating, setGenerating] = useState(false);
  const [themeError, setThemeError] = useState('');
  const themeFileRef = useRef<HTMLInputElement>(null);

  // Custom avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const theme = loadTheme();
    setActiveTheme(theme);
    setActiveAvatar(loadAvatar());
    setCustomAvatarUrl(loadCustomAvatar());
    setCustomTheme(loadCustomTheme());

    (async () => {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*'),
        supabase.from('completion_logs').select('*'),
      ]);

      const loadedHabits = (habitsRes.data as Habit[]) || [];
      const logsData = logsRes.data || [];
      // Streak derives directly from completion_logs — no streaks table read.
      setStreak(computeStreakFromLogs(loadedHabits, logsData.map((l) => l.completed_date as string)));
      setTotalCompletions(logsData.length);
    })();
  }, []);

  const handleThemeSelect = (id: ThemeId) => {
    setActiveTheme(id);
    applyTheme(id);
    localStorage.setItem(THEME_KEY, id);
  };

  const handleAvatarSelect = (id: string) => {
    setActiveAvatar(id);
    localStorage.setItem(AVATAR_KEY, id);
    // Clear custom avatar when picking a built-in
    if (customAvatarUrl) {
      localStorage.removeItem(CUSTOM_AVATAR_KEY);
      setCustomAvatarUrl(null);
    }
  };

  const handleImageThemeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setThemeError('Please select an image file');
      return;
    }
    setThemeError('');
    setGenerating(true);
    try {
      const generated = await generateThemeFromImage(file);
      saveCustomTheme(generated);
      setCustomTheme(generated);
      applyTheme('custom');
      setActiveTheme('custom');
      localStorage.setItem(THEME_KEY, 'custom');
    } catch (err) {
      setThemeError(err instanceof Error ? err.message : 'Failed to generate theme from image');
    } finally {
      setGenerating(false);
      if (themeFileRef.current) themeFileRef.current.value = '';
    }
  };

  const handleRemoveCustomTheme = () => {
    clearCustomTheme();
    setCustomTheme(null);
    if (activeTheme === 'custom') {
      handleThemeSelect('dark-space');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      localStorage.setItem(CUSTOM_AVATAR_KEY, result);
      setCustomAvatarUrl(result);
      setActiveAvatar('');
      localStorage.removeItem(AVATAR_KEY);
      setAvatarUploading(false);
    };
    reader.onerror = () => setAvatarUploading(false);
    reader.readAsDataURL(file);
    if (avatarFileRef.current) avatarFileRef.current.value = '';
  };

  const handleRemoveCustomAvatar = () => {
    localStorage.removeItem(CUSTOM_AVATAR_KEY);
    setCustomAvatarUrl(null);
    if (activeAvatar === '') {
      setActiveAvatar('monk');
      localStorage.setItem(AVATAR_KEY, 'monk');
    }
  };

  // Determine which badges are unlocked
  const unlockedBadges = new Set<string>();
  if (totalCompletions >= 1) unlockedBadges.add('first-step');
  if (streak >= 3) unlockedBadges.add('consistent');
  if (streak >= 7) unlockedBadges.add('week-warrior');
  if (streak >= 30) unlockedBadges.add('monk-mode');
  if (streak >= 100) unlockedBadges.add('orbit-master');
  if (totalCompletions >= 100) unlockedBadges.add('centurion');
  if (streak >= 60) unlockedBadges.add('unbreakable');
  // speed-demon is a stretch goal — not mechanically tracked yet

  const firstName = userName.split(' ')[0] || 'there';
  const selectedAvatar = avatars.find((a) => a.id === activeAvatar) || avatars[0];
  const usingCustomAvatar = !!customAvatarUrl && activeAvatar === '';

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Themes & Customization
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Sparkles size={13} />
          {firstName}, personalize your Orbit experience
        </p>
      </motion.div>

      {/* Theme Selector */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <div className="mb-4 flex items-center gap-2">
          <Palette size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Theme
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {themes.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <motion.button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                className={`relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                  isActive ? 'shadow-lg' : ''
                }`}
                style={{
                  borderColor: isActive ? theme.vars['--accent-primary'] : theme.vars['--border-subtle'],
                  background: theme.vars['--bg-card'],
                  boxShadow: isActive ? `0 8px 32px ${theme.vars['--accent-glow']}` : undefined,
                }}
              >
                {/* Swatch preview */}
                <div className="mb-4 flex gap-2">
                  {theme.swatch.map((color) => (
                    <div
                      key={color}
                      className="h-8 w-8 rounded-lg"
                      style={{ backgroundColor: color, boxShadow: `0 2px 8px ${color}40` }}
                    />
                  ))}
                </div>

                <h3 className="text-sm font-semibold" style={{ color: theme.vars['--text-primary'] }}>
                  {theme.name}
                </h3>
                <p className="mt-1 text-xs" style={{ color: theme.vars['--text-secondary'] }}>
                  {theme.description}
                </p>

                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.vars['--accent-primary'] }}
                  >
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Custom Theme Generator */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-8"
      >
        <div className="mb-4 flex items-center gap-2">
          <ImageIcon size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Custom Theme Generator
          </h2>
        </div>

        <div
          className="rounded-xl border p-6"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
        >
          <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Upload an image from your device and Orbit will generate a matching color palette for the entire app.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <input
              ref={themeFileRef}
              type="file"
              accept="image/*"
              onChange={handleImageThemeUpload}
              className="hidden"
            />
            <button
              onClick={() => themeFileRef.current?.click()}
              disabled={generating}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Image
                </>
              )}
            </button>

            {customTheme && (
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {customTheme.swatch.map((color) => (
                    <div
                      key={color}
                      className="h-7 w-7 rounded-lg"
                      style={{ backgroundColor: color, boxShadow: `0 2px 8px ${color}40` }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {activeTheme === 'custom' ? 'Active' : 'Saved'}
                </span>
                {activeTheme !== 'custom' && (
                  <button
                    onClick={() => handleThemeSelect('custom')}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--border-active)', color: 'var(--accent-primary)' }}
                  >
                    Apply
                  </button>
                )}
                <button
                  onClick={handleRemoveCustomTheme}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-400/70 transition-all hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          {themeError && (
            <p className="mt-3 text-xs text-red-400">{themeError}</p>
          )}
        </div>
      </motion.section>

      {/* Avatar Selector */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="mb-4 flex items-center gap-2">
          <UserCircle2 size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Discipline Avatar
          </h2>
        </div>

        {/* Current avatar preview */}
        <div
          className="mb-4 flex items-center gap-4 rounded-xl border p-4"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
        >
          {usingCustomAvatar && customAvatarUrl ? (
            <img
              src={customAvatarUrl}
              alt="Custom avatar"
              className="h-14 w-14 rounded-full object-cover shadow-lg"
            />
          ) : (
            <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${selectedAvatar.gradient} shadow-lg`}>
              <selectedAvatar.icon size={26} className="text-white" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {usingCustomAvatar ? 'Custom Photo' : selectedAvatar.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {usingCustomAvatar ? 'Uploaded from your gallery' : selectedAvatar.description}
            </p>
          </div>
          {usingCustomAvatar && (
            <button
              onClick={handleRemoveCustomAvatar}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-400/70 transition-all hover:text-red-400"
            >
              <Trash2 size={13} />
              Remove
            </button>
          )}
        </div>

        {/* Custom avatar uploader */}
        <div
          className="mb-4 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
        >
          <div className="flex items-center gap-2.5">
            <Upload size={15} style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Upload your own photo as a profile avatar
            </span>
          </div>
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <button
            onClick={() => avatarFileRef.current?.click()}
            disabled={avatarUploading}
            className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: 'var(--border-active)', color: 'var(--accent-primary)' }}
          >
            {avatarUploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ImageIcon size={14} />
            )}
            Choose from Gallery
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {avatars.map((avatar) => {
            const isActive = !usingCustomAvatar && activeAvatar === avatar.id;
            return (
              <motion.button
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar.id)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-300`}
                style={{
                  borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: isActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${avatar.gradient} shadow-md`}>
                  <avatar.icon size={22} className="text-white" />
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {avatar.name}
                </span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Achievement Badges */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <div className="mb-4 flex items-center gap-2">
          <Trophy size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Achievement Badges
          </h2>
          <span
            className="ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}
          >
            {unlockedBadges.size} / {badges.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
          {badges.map((badge) => {
            const unlocked = unlockedBadges.has(badge.id);
            const tier = tierColors[badge.tier];
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={unlocked ? { y: -4 } : undefined}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300`}
                style={{
                  borderColor: unlocked ? undefined : 'var(--border-subtle)',
                  background: unlocked ? undefined : 'var(--bg-card)',
                  opacity: unlocked ? 1 : 0.5,
                }}
              >
                {unlocked ? (
                  <div className={`absolute inset-0 bg-gradient-to-br ${badge.gradient} opacity-10`} />
                ) : null}

                <div className="relative">
                  <div
                    className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      unlocked ? `bg-gradient-to-br ${badge.gradient} shadow-lg` : 'bg-white/5'
                    }`}
                  >
                    {unlocked ? (
                      <badge.icon size={26} className="text-white" />
                    ) : (
                      <Lock size={20} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>

                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {badge.name}
                  </h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {badge.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${tier.text}`}>
                      {tier.label}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {badge.requirement}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Stats summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3"
      >
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
        >
          <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Current Streak
          </p>
          <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>
            {streak}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>days</p>
        </div>
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
        >
          <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Total Completions
          </p>
          <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--accent-secondary)' }}>
            {totalCompletions}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>habits done</p>
        </div>
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
        >
          <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Badges Earned
          </p>
          <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>
            {unlockedBadges.size}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>of {badges.length}</p>
        </div>
      </motion.div>

      {/* Custom Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border-t pt-8"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo + slogan */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full" style={{ background: 'var(--accent-glow)', filter: 'blur(8px)' }} />
              <OrbitIcon size={28} className="relative" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Orbit
              </p>
              <p className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Your habit in orbit
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-xs transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-xs transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Terms
            </a>
            <a
              href="#"
              className="text-xs transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Support
            </a>
            <div className="flex items-center gap-3">
              <a href="#" className="transition-opacity hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                <Github size={16} />
              </a>
              <a href="#" className="transition-opacity hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                <Twitter size={16} />
              </a>
              <a href="#" className="transition-opacity hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
          © 2026 Orbit. All habits reserved. Built with discipline.
        </p>
      </motion.footer>
    </div>
  );
}
