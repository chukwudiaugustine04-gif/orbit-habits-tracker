import { useCallback, useEffect, useRef, useState } from 'react';

export type ScanPhase = 'idle' | 'requesting' | 'scanning' | 'analyzing' | 'done' | 'error';
export type HeartReadingSource = 'camera' | 'tap';

export interface HeartReading {
  bpm: number;
  source: HeartReadingSource;
  at: number;
}

interface ScanState {
  phase: ScanPhase;
  bpm: number | null;
  progress: number;
  error: string;
  pulse: number;
  ecg: number[];
  tapCount: number;
}

const HISTORY_KEY = 'orbit-heart-history';
const HISTORY_LIMIT = 100;
const SCAN_DURATION_MS = 10000;
const MIN_PEAK_INTERVAL_MS = 350;
const MAX_PEAK_INTERVAL_MS = 1500;
const ECG_LENGTH = 140;
const TAP_WINDOW = 8;
const TAP_MIN_INTERVAL_MS = 300;
const TAP_MAX_INTERVAL_MS = 2000;

type TrackCtor = typeof MediaStreamTrack & {
  getCapabilities?: () => { torch?: boolean };
};

function loadHistory(): HeartReading[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as HeartReading[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function bpmFromIntervals(intervals: number[]): number {
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return Math.round(60000 / avg);
}

const IDLE_STATE: ScanState = {
  phase: 'idle',
  bpm: null,
  progress: 0,
  error: '',
  pulse: 0,
  ecg: [],
  tapCount: 0,
};

/**
 * Heart rate via photoplethysmography (PPG): the user covers the rear camera
 * and flashlight, and brightness changes from blood flow are turned into a
 * live waveform and a BPM. A manual tap mode is also available.
 */
export function useHeartRateScan() {
  const [state, setState] = useState<ScanState>(IDLE_STATE);
  const [history, setHistory] = useState<HeartReading[]>(() => loadHistory());

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const samplesRef = useRef<number[]>([]);
  const peaksRef = useRef<number[]>([]);
  const lastPeakAtRef = useRef(0);
  const ecgRef = useRef<number[]>([]);
  const tapsRef = useRef<number[]>([]);

  const saveReading = useCallback((bpm: number, source: HeartReadingSource) => {
    const reading: HeartReading = { bpm, source, at: Date.now() };
    setHistory((prev) => {
      const next = [reading, ...prev].slice(0, HISTORY_LIMIT);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const track = trackRef.current;
    if (track) {
      const capabilities = (track as unknown as TrackCtor).getCapabilities?.();
      if (capabilities?.torch) {
        track.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] }).catch(() => {});
      }
      track.stop();
      trackRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const finalize = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const peaks = peaksRef.current;
    if (peaks.length < 3) {
      setState((prev) => ({
        ...prev,
        phase: 'error',
        error: 'Could not detect a clear pulse. Press your finger fully over the camera and flashlight, then try again.',
      }));
      cleanup();
      return;
    }

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const dt = peaks[i] - peaks[i - 1];
      if (dt >= MIN_PEAK_INTERVAL_MS && dt <= MAX_PEAK_INTERVAL_MS) intervals.push(dt);
    }

    if (intervals.length < 2) {
      setState((prev) => ({
        ...prev,
        phase: 'error',
        error: 'Pulse signal was too noisy to measure. Keep your finger steady and try again.',
      }));
      cleanup();
      return;
    }

    const bpm = bpmFromIntervals(intervals);
    saveReading(bpm, 'camera');
    setState((prev) => ({ ...prev, phase: 'done', bpm, progress: 1 }));
    cleanup();
  }, [cleanup, saveReading]);

  const sampleFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = 64;
    const h = 48;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    try {
      ctx.drawImage(video, 0, 0, w, h);
    } catch {
      rafRef.current = requestAnimationFrame(sampleFrame);
      return;
    }

    const img = ctx.getImageData(0, 0, w, h);
    let redSum = 0;
    const px = img.data;
    for (let i = 0; i < px.length; i += 4) redSum += px[i];
    const avgRed = redSum / (w * h) / 255;

    const samples = samplesRef.current;
    samples.push(avgRed);
    if (samples.length > 300) samples.shift();

    const recent = samples.slice(-30);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const deviation = avgRed - mean;
    const pulseVal = Math.max(0, Math.min(1, deviation * 18 + 0.5));

    const ecg = ecgRef.current;
    ecg.push(deviation * 40);
    if (ecg.length > ECG_LENGTH) ecg.shift();

    if (samples.length > 20) {
      const window = samples.slice(-12);
      const wmean = window.reduce((a, b) => a + b, 0) / window.length;
      const now = performance.now();
      if (avgRed - wmean > 0.012 && now - lastPeakAtRef.current > MIN_PEAK_INTERVAL_MS) {
        lastPeakAtRef.current = now;
        peaksRef.current.push(now);
        if (peaksRef.current.length > 30) peaksRef.current.shift();
      }
    }

    const elapsed = performance.now() - startedAtRef.current;
    const progress = Math.min(1, elapsed / SCAN_DURATION_MS);
    setState((prev) => ({ ...prev, pulse: pulseVal, progress, ecg: [...ecg] }));

    if (elapsed >= SCAN_DURATION_MS) {
      finalize();
      return;
    }
    rafRef.current = requestAnimationFrame(sampleFrame);
  }, [finalize]);

  const startScan = useCallback(async () => {
    setState({ ...IDLE_STATE, phase: 'requesting' });
    samplesRef.current = [];
    peaksRef.current = [];
    ecgRef.current = [];
    lastPeakAtRef.current = 0;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState((prev) => ({
        ...prev,
        phase: 'error',
        error: 'Camera access is not supported in this browser. Try Chrome or Safari on a mobile device.',
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      try {
        const capabilities = (track as unknown as TrackCtor).getCapabilities?.();
        if (capabilities?.torch) {
          await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
        }
      } catch {
        // torch unsupported; ambient light may still be enough
      }

      const video = videoRef.current;
      if (!video) {
        cleanup();
        setState((prev) => ({ ...prev, phase: 'error', error: 'Video element unavailable.' }));
        return;
      }
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      await video.play().catch(() => {});

      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');

      startedAtRef.current = performance.now();
      setState((prev) => ({ ...prev, phase: 'scanning' }));
      rafRef.current = requestAnimationFrame(sampleFrame);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access to measure your heart rate.'
          : err instanceof DOMException && err.name === 'NotFoundError'
          ? 'No rear camera found on this device.'
          : 'Could not start the camera. ' + (err instanceof Error ? err.message : '');
      setState((prev) => ({ ...prev, phase: 'error', error: message }));
      cleanup();
    }
  }, [cleanup, sampleFrame]);

  const cancelScan = useCallback(() => {
    cleanup();
    setState(IDLE_STATE);
  }, [cleanup]);

  const reset = useCallback(() => {
    setState(IDLE_STATE);
  }, []);

  const tapBeat = useCallback(() => {
    const now = performance.now();
    const taps = tapsRef.current;
    const last = taps[taps.length - 1];
    if (last !== undefined && now - last > TAP_MAX_INTERVAL_MS) {
      tapsRef.current = [now];
    } else if (last === undefined || now - last >= TAP_MIN_INTERVAL_MS) {
      tapsRef.current = [...taps, now].slice(-TAP_WINDOW);
    } else {
      return;
    }
    const list = tapsRef.current;
    const intervals: number[] = [];
    for (let i = 1; i < list.length; i++) intervals.push(list[i] - list[i - 1]);
    const bpm = intervals.length >= 2 ? bpmFromIntervals(intervals) : null;
    setState((prev) => ({ ...prev, phase: 'done', bpm, tapCount: list.length }));
  }, []);

  const finishTap = useCallback(() => {
    const list = tapsRef.current;
    if (list.length < 4) {
      setState((prev) => ({ ...prev, phase: 'error', error: 'Tap along with at least 4 heartbeats to record a reading.' }));
      return;
    }
    const intervals: number[] = [];
    for (let i = 1; i < list.length; i++) intervals.push(list[i] - list[i - 1]);
    const bpm = bpmFromIntervals(intervals);
    tapsRef.current = [];
    saveReading(bpm, 'tap');
    setState((prev) => ({ ...prev, phase: 'done', bpm, tapCount: 0 }));
  }, [saveReading]);

  const startTapMode = useCallback(() => {
    tapsRef.current = [];
    setState({ ...IDLE_STATE, phase: 'analyzing' });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return {
    ...state,
    history,
    videoRef,
    startScan,
    cancelScan,
    reset,
    startTapMode,
    tapBeat,
    finishTap,
    clearHistory,
  };
}
