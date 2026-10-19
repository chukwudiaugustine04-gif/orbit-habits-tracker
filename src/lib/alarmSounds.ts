/**
 * Web Audio API alarm sound engine for Orbit.
 *
 * Provides four high-decibel preset alarm sounds rendered to AudioBuffers
 * via OfflineAudioContext, plus playback of user-uploaded custom audio.
 * All playback runs through a master gain node (user-controlled boost,
 * can exceed 1.0 to push beyond default HTML5 audio loudness) followed by
 * a soft-clip waveshaper and a dynamics compressor so high gain stays
 * loud without harsh digital clipping.
 */

export type PresetId = 'digital-siren' | 'radar' | 'heavy-pulse' | 'gentle-wake';

export interface AlarmPreset {
  id: PresetId;
  name: string;
  description: string;
}

export const ALARM_PRESETS: AlarmPreset[] = [
  { id: 'digital-siren', name: 'Digital Siren', description: 'Sharp two-tone square siren, hard to sleep through' },
  { id: 'radar', name: 'Radar', description: 'Rising sweep pings with space between beats' },
  { id: 'heavy-pulse', name: 'Heavy Pulse', description: 'Deep low-frequency bass pulse with a kick' },
  { id: 'gentle-wake', name: 'Gentle Wake', description: 'Soft rising major chord for lighter reminders' },
];

type WindowWithWebkit = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as WindowWithWebkit;
  return w.AudioContext || w.webkitAudioContext || null;
}

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let shaper: WaveShaperNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

function ensureChain(): AudioContext | null {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 2.0;

    shaper = ctx.createWaveShaper();
    shaper.curve = makeSoftClipCurve(2.5);
    shaper.oversample = '4x';

    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -10;
    compressor.knee.value = 24;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    masterGain.connect(shaper);
    shaper.connect(compressor);
    compressor.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function makeSoftClipCurve(amount: number): Float32Array {
  const n = 4096;
  const curve = new Float32Array(n);
  const k = Math.tanh(amount);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * amount) / k;
  }
  return curve;
}

interface Motif {
  duration: number;
  schedule(ctx: BaseAudioContext, dest: AudioNode, t0: number): void;
}

function env(gain: GainNode, ctx: BaseAudioContext, t0: number, attack: number, sustain: number, release: number, peak: number) {
  const g = gain.gain;
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(peak, t0 + attack);
  g.setValueAtTime(peak, t0 + attack + sustain);
  g.exponentialRampToValueAtTime(0.0001, t0 + attack + sustain + release);
}

const MOTIFS: Record<PresetId, Motif> = {
  'digital-siren': {
    duration: 2.0,
    schedule(ctx, dest, t0) {
      const seg = 0.25;
      const freqs = [820, 820, 600, 600, 820, 820, 600, 600];
      for (let i = 0; i < freqs.length; i++) {
        const start = t0 + i * seg;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freqs[i];
        // sub-octave for body
        const sub = ctx.createOscillator();
        const subG = ctx.createGain();
        sub.type = 'sawtooth';
        sub.frequency.value = freqs[i] / 2;
        env(g, ctx, start, 0.005, seg * 0.6, seg * 0.3, 0.5);
        env(subG, ctx, start, 0.005, seg * 0.6, seg * 0.3, 0.18);
        osc.connect(g);
        sub.connect(subG);
        g.connect(dest);
        subG.connect(dest);
        osc.start(start);
        osc.stop(start + seg + 0.02);
        sub.start(start);
        sub.stop(start + seg + 0.02);
      }
    },
  },
  radar: {
    duration: 1.6,
    schedule(ctx, dest, t0) {
      const pings = [
        { at: 0.0, peak: 0.55 },
        { at: 0.8, peak: 0.4 },
      ];
      for (const p of pings) {
        const start = t0 + p.at;
        const dur = 0.5;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, start);
        osc.frequency.exponentialRampToValueAtTime(1300, start + dur * 0.5);
        osc.frequency.exponentialRampToValueAtTime(420, start + dur);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(p.peak, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(g);
        g.connect(dest);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      }
    },
  },
  'heavy-pulse': {
    duration: 1.0,
    schedule(ctx, dest, t0) {
      // bass drone
      const bass = ctx.createOscillator();
      const bassG = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.value = 78;
      bassG.gain.setValueAtTime(0.0001, t0);
      bassG.gain.exponentialRampToValueAtTime(0.35, t0 + 0.05);
      bassG.gain.setValueAtTime(0.35, t0 + 0.9);
      bassG.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0);
      bass.connect(bassG);
      bassG.connect(dest);
      bass.start(t0);
      bass.stop(t0 + 1.02);
      // kicks at 0 and 0.5
      for (const kAt of [0.0, 0.5]) {
        const start = t0 + kAt;
        const kick = ctx.createOscillator();
        const kg = ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(160, start);
        kick.frequency.exponentialRampToValueAtTime(45, start + 0.18);
        kg.gain.setValueAtTime(0.9, start);
        kg.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
        kick.connect(kg);
        kg.connect(dest);
        kick.start(start);
        kick.stop(start + 0.24);
      }
    },
  },
  'gentle-wake': {
    duration: 3.0,
    schedule(ctx, dest, t0) {
      const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
      notes.forEach((freq, i) => {
        const start = t0 + i * 0.15;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.18, start + 1.4);
        g.gain.setValueAtTime(0.18, t0 + 2.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.0);
        osc.connect(g);
        g.connect(dest);
        osc.start(start);
        osc.stop(t0 + 3.02);
      });
    },
  },
};

const renderedCache = new Map<PresetId, AudioBuffer>();

async function renderPresetBuffer(presetId: PresetId): Promise<AudioBuffer> {
  const cached = renderedCache.get(presetId);
  if (cached) return cached;

  const motif = MOTIFS[presetId];
  const sampleRate = 44100;
  const length = Math.ceil(sampleRate * motif.duration);
  const offline = new OfflineAudioContext(2, length, sampleRate);
  motif.schedule(offline, offline.destination, 0);
  const buffer = await offline.startRendering();
  renderedCache.set(presetId, buffer);
  return buffer;
}

export interface AlarmSource {
  kind: 'preset' | 'custom';
  presetId?: PresetId;
  customBuffer?: AudioBuffer;
}

export interface AlarmHandle {
  stop: () => void;
}

/**
 * Start a looping alarm. `gainBoost` multiplies the master gain (1.0 = no
 * boost, up to ~5.0 for very loud). The alarm loops continuously until
 * `stop()` is called on the returned handle.
 */
export async function startAlarm(source: AlarmSource, gainBoost: number): Promise<AlarmHandle> {
  const audioCtx = ensureChain();
  if (!audioCtx || !masterGain) return { stop: () => {} };

  masterGain.gain.value = gainBoost;

  let buffer: AudioBuffer | null = null;
  if (source.kind === 'preset' && source.presetId) {
    buffer = await renderPresetBuffer(source.presetId);
  } else if (source.kind === 'custom' && source.customBuffer) {
    buffer = source.customBuffer;
  }
  if (!buffer) return { stop: () => {} };

  const srcNode = audioCtx.createBufferSource();
  srcNode.buffer = buffer;
  srcNode.loop = true;
  srcNode.connect(masterGain);
  srcNode.start();

  return {
    stop: () => {
      try {
        srcNode.stop();
      } catch {
        // already stopped
      }
      srcNode.disconnect();
    },
  };
}

/**
 * Decode a raw audio file (ArrayBuffer of mp3/wav/etc) into an AudioBuffer
 * suitable for looped alarm playback.
 */
export async function decodeCustomAudio(data: ArrayBuffer): Promise<AudioBuffer> {
  const audioCtx = ensureChain();
  if (!audioCtx) throw new Error('Web Audio API unavailable');
  return await audioCtx.decodeAudioData(data.slice(0));
}

/**
 * Play a one-shot preview of a preset (used by the settings panel).
 * Returns a stop handle; callers may also let it auto-loop and stop later.
 */
export async function previewPreset(presetId: PresetId, gainBoost: number): Promise<AlarmHandle> {
  return startAlarm({ kind: 'preset', presetId }, gainBoost);
}

/**
 * Play a one-shot preview of a custom audio buffer.
 */
export async function previewCustom(buffer: AudioBuffer, gainBoost: number): Promise<AlarmHandle> {
  return startAlarm({ kind: 'custom', customBuffer: buffer }, gainBoost);
}
