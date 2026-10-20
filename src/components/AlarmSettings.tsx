import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import CustomAudioUploader from './CustomAudioUploader';
import {
  
  Bell,
  Upload,
  Trash2,
  Play,
  Square,
  Volume2,
  Clock,
  Check,
  Loader2,
} from 'lucide-react';
import {
  ALARM_PRESETS,
  previewPreset,
  previewCustom,
  decodeCustomAudio,
  type AlarmHandle,
  type PresetId,
} from '@/lib/alarmSounds';
import {
  loadAlarmSettings,
  saveAlarmSettings,
  type AlarmSettings,
} from '@/lib/alarmSettings';
import {
  listSounds,
  saveSound,
  deleteSound,
  getSound,
  type SoundMeta,
} from '@/lib/alarmStorage';

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg'];

function isAcceptedType(file: File): boolean {
  if (ACCEPTED.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg');
}

export default function AlarmSettings() {
  const [settings, setSettings] = useState<AlarmSettings>(() => loadAlarmSettings());
  const [sounds, setSounds] = useState<SoundMeta[]>([]);
  const [loadingSounds, setLoadingSounds] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewing, setPreviewing] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewHandleRef = useRef<AlarmHandle | null>(null);

  useEffect(() => {
    listSounds()
      .then(setSounds)
      .catch(() => setSounds([]))
      .finally(() => setLoadingSounds(false));
  }, []);

  // Stop any preview sound when the panel unmounts.
  useEffect(() => {
    return () => {
      previewHandleRef.current?.stop();
      previewHandleRef.current = null;
    };
  }, []);

  const update = (patch: Partial<AlarmSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveAlarmSettings(next);
  };

  const stopPreview = () => {
    previewHandleRef.current?.stop();
    previewHandleRef.current = null;
    setPreviewing(null);
  };

  const togglePreviewPreset = async (id: PresetId) => {
    if (previewing === `preset-${id}`) {
      stopPreview();
      return;
    }
    stopPreview();
    try {
      previewHandleRef.current = await previewPreset(id, settings.gainBoost);
      setPreviewing(`preset-${id}`);
    } catch {
      setError('Could not play preview. Tap anywhere on the page first, then try again.');
    }
  };

  const togglePreviewCustom = async (soundId: string) => {
    if (previewing === `custom-${soundId}`) {
      stopPreview();
      return;
    }
    stopPreview();
    try {
      const stored = await getSound(soundId);
      if (!stored) {
        setError('Custom sound not found. It may have been removed.');
        return;
      }
      const buffer = await decodeCustomAudio(stored.arrayBuffer);
      previewHandleRef.current = await previewCustom(buffer, settings.gainBoost);
      setPreviewing(`custom-${soundId}`);
    } catch {
      setError('Could not decode this audio file. Try a different .mp3 or .wav.');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAcceptedType(file)) {
      setError('Please choose an .mp3, .wav, or .ogg audio file.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Audio file is too large. Please keep it under 8 MB.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setError('');
    setUploading(true);
    try {
      // Verify it actually decodes before storing.
      const buf = await file.arrayBuffer();
      await decodeCustomAudio(buf.slice(0));
      const meta = await saveSound(file);
      const updated = await listSounds();
      setSounds(updated);
      update({ source: 'custom', customSoundId: meta.id });
    } catch {
      setError('Could not read this audio file. Try a different one.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteSound = async (id: string) => {
    await deleteSound(id);
    const updated = await listSounds();
    setSounds(updated);
    if (settings.source === 'custom' && settings.customSoundId === id) {
      update({ source: 'preset', customSoundId: null });
    }
  };

  const gainLabel =
    settings.gainBoost <= 1.5 ? 'Normal' :
    settings.gainBoost <= 3 ? 'Loud' :
    settings.gainBoost <= 4 ? 'Very Loud' : 'Maximum';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mb-8"
    >
      <div className="mb-4 flex items-center gap-2">
        <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Alarm Sounds
        </h2>
      </div>

      <div
        className="rounded-xl border p-6"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
      >
        <p className="mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choose a loud preset alarm, upload your own ringtone, and boost the volume beyond normal limits. Alarms ring until you dismiss them.
        </p>
        {/* Custom Audio Uploader Section */}
        <div className="mb-6">
          <CustomAudioUploader 
            onAudioSaved={(audioId) => {
              localStorage.setItem('orbit-custom-alarm-sound', audioId);
            }} 
          />
        </div>

        {/* Preset grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ALARM_PRESETS.map((preset) => {
            const selected = settings.source === 'preset' && settings.presetId === preset.id;
            const isPreviewing = previewing === `preset-${preset.id}`;
            return (
              <div
                key={preset.id}
                className={`relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  selected ? '' : 'hover:opacity-90'
                }`}
                style={{
                  borderColor: selected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: selected ? 'var(--accent-glow)' : 'transparent',
                }}
              >
                <button
                  onClick={() => update({ source: 'preset', presetId: preset.id })}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {preset.name}
                    </span>
                    {selected && (
                      <Check size={14} style={{ color: 'var(--accent-primary)' }} strokeWidth={3} />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {preset.description}
                  </p>
                </button>
                <button
                  onClick={() => togglePreviewPreset(preset.id)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition-all"
                  style={{
                    borderColor: isPreviewing ? 'var(--accent-primary)' : 'var(--border-active)',
                    color: isPreviewing ? '#fff' : 'var(--accent-primary)',
                    background: isPreviewing ? 'var(--accent-primary)' : 'transparent',
                  }}
                  aria-label={isPreviewing ? 'Stop preview' : 'Preview sound'}
                >
                  {isPreviewing ? <Square size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-6 h-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Custom upload */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Custom Ringtone
          </h3>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            .mp3 · .wav · .ogg · max 8 MB
          </span>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
          style={{
            borderColor: 'var(--border-active)',
            color: 'var(--accent-primary)',
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload size={14} />
              Upload Audio
            </>
          )}
        </button>

        {sounds.length > 0 && (
          <div className="mt-4 space-y-2">
            {sounds.map((sound) => {
              const selected = settings.source === 'custom' && settings.customSoundId === sound.id;
              const isPreviewing = previewing === `custom-${sound.id}`;
              return (
                <div
                  key={sound.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                  style={{
                    borderColor: selected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    background: selected ? 'var(--accent-glow)' : 'transparent',
                  }}
                >
                  <button
                    onClick={() => update({ source: 'custom', customSoundId: sound.id })}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {sound.name}
                      </span>
                      {selected && (
                        <Check size={13} style={{ color: 'var(--accent-primary)' }} strokeWidth={3} />
                      )}
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {(sound.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </button>
                  <button
                    onClick={() => togglePreviewCustom(sound.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all"
                    style={{
                      borderColor: isPreviewing ? 'var(--accent-primary)' : 'var(--border-active)',
                      color: isPreviewing ? '#fff' : 'var(--accent-primary)',
                      background: isPreviewing ? 'var(--accent-primary)' : 'transparent',
                    }}
                    aria-label={isPreviewing ? 'Stop preview' : 'Preview sound'}
                  >
                    {isPreviewing ? <Square size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
                  </button>
                  <button
                    onClick={() => handleDeleteSound(sound.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400/70 transition-all hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Delete custom sound"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        {/* Divider */}
        <div className="my-6 h-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Gain boost slider */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={15} style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Loudness Boost
              </span>
            </div>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}
            >
              {gainLabel} · {settings.gainBoost.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={0.5}
            value={settings.gainBoost}
            onChange={(e) => update({ gainBoost: parseFloat(e.target.value) })}
            className="w-full accent-[var(--accent-primary)]"
            aria-label="Loudness boost"
          />
          <div className="mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>Normal</span>
            <span>Loud</span>
            <span>Maximum</span>
          </div>
        </div>

        {/* Snooze duration */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Clock size={15} style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Snooze Duration
            </span>
          </div>
          <div className="flex gap-2">
            {[3, 5, 10, 15].map((mins) => {
              const selected = settings.snoozeMinutes === mins;
              return (
                <button
                  key={mins}
                  onClick={() => update({ snoozeMinutes: mins })}
                  className="rounded-lg border px-4 py-2 text-xs font-medium transition-all"
                  style={{
                    borderColor: selected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    background: selected ? 'var(--accent-glow)' : 'transparent',
                    color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {mins} min
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
