import { useCallback, useEffect, useRef, useState } from 'react';

export type ScanPhase = 'idle' | 'requesting' | 'scanning' | 'analyzing' | 'done' | 'error';

interface ScanState {
  phase: ScanPhase;
  bpm: number | null;
  progress: number; // 0..1 during scanning
  error: string;
  /** Live PPG signal value (0..1) for UI pulse animation. */
  pulse: number;
}

const SCAN_DURATION_MS = 10000; // 10-second finger camera scan
const MIN_PEAK_INTERVAL_MS = 350; // ~170 bpm max
const MAX_PEAK_INTERVAL_MS = 1500; // ~40 bpm min

type TrackCtor = typeof MediaStreamTrack & {
  getCapabilities?: () => { torch?: boolean };
};

/**
 * Measure heart rate via photoplethysmography (PPG): the user presses their
 * finger over the rear camera + flashlight. Blood flow changes the amount of
 * red light absorbed, which we measure as brightness variation in the video
 * feed. We extract a brightness signal, detect periodic peaks, and convert
 * the average peak interval to BPM.
 */
export function useHeartRateScan() {
  const [state, setState] = useState<ScanState>({
    phase: 'idle',
    bpm: null,
    progress: 0,
    error: '',
    pulse: 0,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const samplesRef = useRef<number[]>([]);
  const peaksRef = useRef<number[]>([]);
  const lastPeakAtRef = useRef(0);

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const track = trackRef.current;
    if (track) {
      // Try to turn the torch back off.
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
    if (video) {
      video.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

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
      // video not ready yet
      rafRef.current = requestAnimationFrame(sampleFrame);
      return;
    }

    // Average the RED channel across the frame — red light is what the
    // flashlight provides and what hemoglobin absorption modulates.
    const img = ctx.getImageData(0, 0, w, h);
    let redSum = 0;
    const px = img.data;
    for (let i = 0; i < px.length; i += 4) {
      redSum += px[i];
    }
    const avgRed = redSum / (w * h) / 255; // normalize 0..1

    samplesRef.current.push(avgRed);
    if (samplesRef.current.length > 300) samplesRef.current.shift();

    // Live pulse feedback: normalized deviation from the running mean.
    const recent = samplesRef.current.slice(-30);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const pulseVal = Math.max(0, Math.min(1, (avgRed - mean) * 18 + 0.5));
    setState((prev) => ({ ...prev, pulse: pulseVal }));

    // Peak detection on the brightness signal. We compare each sample to a
    // short moving average and register a peak when it rises above a
    // dynamic threshold and then falls back below it.
    const samples = samplesRef.current;
    if (samples.length > 20) {
      const window = samples.slice(-12);
      const wmean = window.reduce((a, b) => a + b, 0) / window.length;
      const now = performance.now();
      const delta = avgRed - wmean;

      // Rising edge past threshold
      if (delta > 0.012 && now - lastPeakAtRef.current > MIN_PEAK_INTERVAL_MS) {
        lastPeakAtRef.current = now;
        peaksRef.current.push(now);
        if (peaksRef.current.length > 30) peaksRef.current.shift();
      }
    }

    // Progress + phase transitions
    const elapsed = performance.now() - startedAtRef.current;
    const progress = Math.min(1, elapsed / SCAN_DURATION_MS);
    setState((prev) => ({ ...prev, progress }));

    if (elapsed >= SCAN_DURATION_MS) {
      finalize();
      return;
    }

    rafRef.current = requestAnimationFrame(sampleFrame);
  }, []);

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

    // Convert peak timestamps (ms) to inter-peak intervals, filter to a
    // physiologically plausible range, and average.
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

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60000 / avgInterval);
    setState((prev) => ({ ...prev, phase: 'done', bpm, progress: 1 }));
    cleanup();
  }, [cleanup]);

  const startScan = useCallback(async () => {
    setState({ phase: 'requesting', bpm: null, progress: 0, error: '', pulse: 0 });
    samplesRef.current = [];
    peaksRef.current = [];
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

      // Try to enable the torch (flashlight) for consistent illumination.
      try {
        const capabilities = (track as unknown as TrackCtor).getCapabilities?.();
        if (capabilities?.torch) {
          await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
        }
      } catch {
        // torch unsupported — the scan still works if ambient light is enough
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

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

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
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    cleanup();
    setState({ phase: 'idle', bpm: null, progress: 0, error: '', pulse: 0 });
  }, [cleanup]);

  const reset = useCallback(() => {
    setState({ phase: 'idle', bpm: null, progress: 0, error: '', pulse: 0 });
  }, []);

  return { ...state, videoRef, startScan, cancelScan, reset };
}
