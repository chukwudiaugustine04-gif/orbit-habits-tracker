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
  ShieldCheck,
  Timer,
  LogOut,
  X,
  Volume2,
  Play,
  Square,
  Bell,
  Wallpaper,
} from 'lucide-react';
import {
  themes,
  applyTheme,
  generateThemeFromImage,
  saveCustomTheme,
  loadCustomTheme,
  clearCustomTheme,
  saveWallpaperImage,
  loadWallpaperImage,
  clearWallpaperImage,
  applyWallpaper,
  type ThemeId,
  type Theme,
} from '@/lib/themes';
import { avatars, badges, tierColors } from '@/lib/cosmetics';
import { supabase } from '@/lib/supabase';
import { computeStreakFromLogs } from '@/lib/streaks';
import type { Habit } from '@/lib/types';
import AlarmSettings from './AlarmSettings';
import {
  AUTO_LOGOUT_OPTIONS,
  loadAutoLogoutMinutes,
  saveAutoLogoutMinutes,
  type AutoLogoutMinutes,
} from '@/lib/useAutoLogout';
import {
  loadDefaultAlertSettings,
  saveDefaultAlertSettings,
  playDefaultAlertChime,
  type DefaultAlertSettings,
} from '@/lib/alarmSettings';
import {
  ALARM_PRESETS,
  previewPreset,
  type AlarmHandle,
  type PresetId,
} from '@/lib/alarmSounds';
import { listSounds, type SoundMeta } from '@/lib/alarmStorage';

interface ThemeSettingsProps {
  userName: string;
  onSignOut?: () => void;
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

export default function ThemeSettings({ userName, onSignOut }: ThemeSettingsProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeId>('dark-space');
  const [activeAvatar, setActiveAvatar] = useState('monk');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState<AutoLogoutMinutes>(() => loadAutoLogoutMinutes());

  const [customTheme, setCustomTheme] = useState<Theme | null>(null);
  const [generating, setGenerating] = useState(false);
  const [themeError, setThemeError] = useState('');
  const themeFileRef = useRef<HTMLInputElement>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [wallpaperUploading, setWallpaperUploading] = useState(false);
  const wallpaperFileRef = useRef<HTMLInputElement>(null);

  const [alertSettings, setAlertSettings] = useState<DefaultAlertSettings>(() => loadDefaultAlertSettings());
  const [alertPreviewing, setAlertPreviewing] = useState<string | null>(null);
  const alertPreviewHandleRef = useRef<AlarmHandle | null>(null);
  const [customSounds, setCustomSounds] = useState<SoundMeta[]>([]);

  useEffect(() => {
    const theme = loadTheme();
    setActiveTheme(theme);
    setActiveAvatar(loadAvatar());
    setCustomAvatarUrl(loadCustomAvatar());
    setCustomTheme(loadCustomTheme());
    setWallpaperUrl(loadWallpaperImage());
    listSounds().then(setCustomSounds).catch(() => {});

    (async () => {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*'),
        supabase.from('completion_logs').select('*'),
      ]);
      const loadedHabits = (habitsRes.data as Habit[]) || [];
      const logsData = logsRes.data || [];
      setStreak(computeStreakFromLogs(loadedHabits, logsData.map((l) => l.completed_date as string)));
      setTotalCompletions(logsData.length);
    })();
  }, []);

  useEffect(() => {
    return () => {
      alertPreviewHandleRef.current?.stop();
    };
  }, []);

  const handleThemeSelect = (id: ThemeId) => {
    setActiveTheme(id);
    applyTheme(id);
    localStorage.setItem(THEME_KEY, id);
  };

  const handleAvatarSelect = (id: string) => {
    setActiveAvatar(id);
    localStorage.setItem(AVATAR_KEY, id);
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

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setWallpaperUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      saveWallpaperImage(result);
      setWallpaperUrl(result);
      applyWallpaper();
      setWallpaperUploading(false);
    };
    reader.onerror = () => setWallpaperUploading(false);
    reader.readAsDataURL(file);
    if (wallpaperFileRef.current) wallpaperFileRef.current.value = '';
  };

  const handleRemoveWallpaper = () => {
    clearWallpaperImage();
    setWallpaperUrl(null);
    applyWallpaper();
  };

  const updateAlert = (patch: Partial<DefaultAlertSettings>) => {
    const next = { ...alertSettings, ...patch };
    setAlertSettings(next);
    saveDefaultAlertSettings(next);
  };

  const stopAlertPreview = () => {
    alertPreviewHandleRef.current?.stop();
    alertPreviewHandleRef.current = null;
    setAlertPreviewing(null);
  };

  const toggleAlertPreviewPreset = async (id: PresetId) => {
    if (alertPreviewing === `preset-${id}`) {
      stopAlertPreview();
      return;
    }
    stopAlertPreview();
    try {
      alertPreviewHandleRef.current = await previewPreset(id, 2);
      setAlertPreviewing(`preset-${id}`);
    } catch { /* ignore */ }
  };

  const handlePreviewDefaultChime = async () => {
    if (alertPreviewing === 'default-chime') {
      stopAlertPreview();
      return;
    }
    stopAlertPreview();
    try {
      alertPreviewHandleRef.current = await playDefaultAlertChime();
      setAlertPreviewing('default-chime');
    } catch { /* ignore */ }
  };

  const unlockedBadges = new Set<string>();
  if (totalCompletions >= 1) unlockedBadges.add('first-step');
  if (streak >= 3) unlockedBadges.add('consistent');
  if (streak >= 7) unlockedBadges.add('week-warrior');
  if (streak >= 30) unlockedBadges.add('monk-mode');
  if (streak >= 100) unlockedBadges.add('orbit-master');
  if (totalCompletions >= 100) unlockedBadges.add('centurion');
  if (streak >= 60) unlockedBadges.add('unbreakable');

  const firstName = userName.split(' ')[0] || 'there';
  const selectedAvatar = avatars.find((a) => a.id === activeAvatar) || avatars[0];
  const usingCustomAvatar = !!customAvatarUrl && activeAvatar === '';
  const activeThemeObj = themes.find((t) => t.id === activeTheme);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Sparkles size={13} />
          {firstName}, personalize your Orbit experience
        </p>
      </motion.div>

      {/* Compact Theme Picker */}
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

        <div
          className="flex items-center gap-4 rounded-xl border p-5"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
        >
          {activeThemeObj && (
            <div className="flex gap-1.5">
              {activeThemeObj.swatch.map((color) => (
                <div
                  key={color}
                  className="h-10 w-10 rounded-lg"
                  style={{ backgroundColor: color, boxShadow: `0 2px 8px ${color}40` }}
                />
              ))}
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {activeThemeObj?.name || 'Custom Theme'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {activeThemeObj?.description || 'Generated from your image'}
            </p>
          </div>
          <button
            onClick={() => setThemeModalOpen(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }}
          >
            <Palette size={15} />
            Change Theme
          </button>
        </div>

        {/* Theme Modal */}
        <AnimatePresence>
          {themeModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setThemeModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Choose a Theme</h3>
                  <button
                    onClick={() => setThemeModalOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <X size={16} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {themes.map((theme) => {
                    const isActive = activeTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => {
                          handleThemeSelect(theme.id);
                          setThemeModalOpen(false);
                        }}
                        className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${isActive ? 'shadow-lg' : ''}`}
                        style={{
                          borderColor: isActive ? theme.vars['--accent-primary'] : theme.vars['--border-subtle'],
                          background: theme.vars['--bg-card'],
                        }}
                      >
                        <div className="mb-3 flex gap-1.5">
                          {theme.swatch.map((color) => (
                            <div key={color} className="h-6 w-6 rounded-md" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <h4 className="text-xs font-semibold" style={{ color: theme.vars['--text-primary'] }}>{theme.name}</h4>
                        {isActive && (
                          <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: theme.vars['--accent-primary'] }}>
                            <Check size={11} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom theme generator inside modal */}
                <div className="mt-5 rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="mb-2 flex items-center gap-2">
                    <ImageIcon size={15} style={{ color: 'var(--accent-primary)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Generate from Image</span>
                  </div>
                  <p className="mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Upload an image and Orbit will create a color palette from it.
                  </p>
                  <input ref={themeFileRef} type="file" accept="image/*" onChange={handleImageThemeUpload} className="hidden" />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => themeFileRef.current?.click()}
                      disabled={generating}
                      className="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ borderColor: 'var(--border-active)', color: 'var(--accent-primary)' }}
                    >
                      {generating ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      {generating ? 'Generating...' : 'Upload Image'}
                    </button>
                    {customTheme && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {customTheme.swatch.map((color) => (
                            <div key={color} className="h-5 w-5 rounded" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        {activeTheme !== 'custom' && (
                          <button onClick={() => { handleThemeSelect('custom'); setThemeModalOpen(false); }} className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>Apply</button>
                        )}
                        <button onClick={handleRemoveCustomTheme} className="text-xs text-red-400/70 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  {themeError && <p className="mt-2 text-xs text-red-400">{themeError}</p>}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Wallpaper */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-8"
      >
        <div className="mb-4 flex items-center gap-2">
          <Wallpaper size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Wallpaper
          </h2>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Set a full image as your background across the entire app.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <input ref={wallpaperFileRef} type="file" accept="image/*" onChange={handleWallpaperUpload} className="hidden" />
            {wallpaperUrl && (
              <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
                <img src={wallpaperUrl} alt="Wallpaper preview" className="h-full w-full object-cover" />
              </div>
            )}
            <button
              onClick={() => wallpaperFileRef.current?.click()}
              disabled={wallpaperUploading}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }}
            >
              {wallpaperUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {wallpaperUrl ? 'Change Wallpaper' : 'Upload Wallpaper'}
            </button>
            {wallpaperUrl && (
              <button
                onClick={handleRemoveWallpaper}
                className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <Trash2 size={14} />
                Remove
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Default Alert Audio */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="mb-4 flex items-center gap-2">
          <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Default Alert Audio
          </h2>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Choose the chime that plays for task reminders and due-task popups.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ALARM_PRESETS.map((preset) => {
              const selected = alertSettings.source === 'preset' && alertSettings.presetId === preset.id;
              const isPreviewing = alertPreviewing === `preset-${preset.id}`;
              return (
                <div
                  key={preset.id}
                  className="flex items-center gap-3 rounded-xl border-2 p-3 transition-all"
                  style={{
                    borderColor: selected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    background: selected ? 'var(--accent-glow)' : 'transparent',
                  }}
                >
                  <button onClick={() => updateAlert({ source: 'preset', presetId: preset.id })} className="flex-1 text-left">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{preset.name}</span>
                    {selected && <Check size={12} className="ml-1 inline" style={{ color: 'var(--accent-primary)' }} />}
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{preset.description}</p>
                  </button>
                  <button
                    onClick={() => toggleAlertPreviewPreset(preset.id)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-all"
                    style={{
                      borderColor: isPreviewing ? 'var(--accent-primary)' : 'var(--border-active)',
                      color: isPreviewing ? '#fff' : 'var(--accent-primary)',
                      background: isPreviewing ? 'var(--accent-primary)' : 'transparent',
                    }}
                  >
                    {isPreviewing ? <Square size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
                  </button>
                </div>
              );
            })}
          </div>

          {customSounds.length > 0 && (
            <>
              <div className="my-4 h-px" style={{ background: 'var(--border-subtle)' }} />
              <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Custom Sounds</h3>
              <div className="space-y-2">
                {customSounds.map((sound) => {
                  const selected = alertSettings.source === 'custom' && alertSettings.customSoundId === sound.id;
                  return (
                    <div
                      key={sound.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                      style={{
                        borderColor: selected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        background: selected ? 'var(--accent-glow)' : 'transparent',
                      }}
                    >
                      <button onClick={() => updateAlert({ source: 'custom', customSoundId: sound.id })} className="flex-1 text-left">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{sound.name}</span>
                        {selected && <Check size={12} className="ml-1 inline" style={{ color: 'var(--accent-primary)' }} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handlePreviewDefaultChime}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all hover:opacity-80"
              style={{ borderColor: 'var(--border-active)', color: 'var(--accent-primary)' }}
            >
              {alertPreviewing === 'default-chime' ? <Square size={13} className="fill-current" /> : <Volume2 size={13} />}
              {alertPreviewing === 'default-chime' ? 'Stop' : 'Preview Chime'}
            </button>
          </div>
        </div>
      </motion.section>

      {/* Alarm Sounds */}
      <AlarmSettings />

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

        <div className="mb-4 flex items-center gap-4 rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          {usingCustomAvatar && customAvatarUrl ? (
            <img src={customAvatarUrl} alt="Custom avatar" className="h-14 w-14 rounded-full object-cover shadow-lg" />
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
            <button onClick={handleRemoveCustomAvatar} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-400/70 transition-all hover:text-red-400">
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2.5">
            <Upload size={15} style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Upload your own photo as a profile avatar</span>
          </div>
          <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          <button
            onClick={() => avatarFileRef.current?.click()}
            disabled={avatarUploading}
            className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: 'var(--border-active)', color: 'var(--accent-primary)' }}
          >
            {avatarUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
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
                className="relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-300"
                style={{
                  borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: isActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${avatar.gradient} shadow-md`}>
                  <avatar.icon size={22} className="text-white" />
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{avatar.name}</span>
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
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Trophy size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Achievement Badges</h2>
          <span className="ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}>
            {unlockedBadges.size} / {badges.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300"
                style={{
                  borderColor: unlocked ? undefined : 'var(--border-subtle)',
                  background: unlocked ? undefined : 'var(--bg-card)',
                  opacity: unlocked ? 1 : 0.5,
                }}
              >
                {unlocked ? <div className={`absolute inset-0 bg-gradient-to-br ${badge.gradient} opacity-10`} /> : null}
                <div className="relative">
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${unlocked ? `bg-gradient-to-br ${badge.gradient} shadow-lg` : 'bg-white/5'}`}>
                    {unlocked ? <badge.icon size={26} className="text-white" /> : <Lock size={20} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{badge.name}</h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{badge.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${tier.text}`}>{tier.label}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{badge.requirement}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Stats summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Current Streak</p>
          <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{streak}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>days</p>
        </div>
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total Completions</p>
          <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--accent-secondary)' }}>{totalCompletions}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>habits done</p>
        </div>
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Badges Earned</p>
          <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{unlockedBadges.size}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>of {badges.length}</p>
        </div>
      </motion.div>

      {/* Auto-Logout */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Timer size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Auto-Logout</h2>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Automatically sign you out after a period of inactivity for your security.
          </p>
          <div className="flex flex-wrap gap-2">
            {AUTO_LOGOUT_OPTIONS.map((opt) => {
              const selected = autoLogoutMinutes === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setAutoLogoutMinutes(opt.value);
                    saveAutoLogoutMinutes(opt.value);
                  }}
                  className="rounded-lg border px-4 py-2 text-xs font-medium transition-all"
                  style={{
                    borderColor: selected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    background: selected ? 'var(--accent-glow)' : 'transparent',
                    color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Account / Logout */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Account</h2>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sign out of your account. You will need to sign in again to access your habits and data.
          </p>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/20"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          )}
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="border-t pt-8" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full" style={{ background: 'var(--accent-glow)', filter: 'blur(8px)' }} />
              <OrbitIcon size={28} className="relative" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Orbit</p>
              <p className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>Your habit in orbit</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="text-xs transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>Privacy</a>
            <a href="#" className="text-xs transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>Terms</a>
            <a href="#" className="text-xs transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>Support</a>
            <div className="flex items-center gap-3">
              <a href="#" className="transition-opacity hover:opacity-80" style={{ color: 'var(--text-secondary)' }}><Github size={16} /></a>
              <a href="#" className="transition-opacity hover:opacity-80" style={{ color: 'var(--text-secondary)' }}><Twitter size={16} /></a>
              <a href="#" className="transition-opacity hover:opacity-80" style={{ color: 'var(--text-secondary)' }}><Mail size={16} /></a>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>© 2026 Orbit. All habits reserved. Built with discipline.</p>
      </motion.footer>
    </div>
  );
}
