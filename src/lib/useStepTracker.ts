import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * iOS Safari requires an explicit user gesture before motion events fire,
 * and exposes requestPermission on the constructor. Other browsers just
 * need the listener.
 */
type DeviceMotionConstructor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export type StepPermission = 'unknown' | 'needed' | 'granted' | 'denied' | 'unsupported';

interface StepState {
  steps: number;
  permission: StepPermission;
  active: boolean;
  /** Magnitude of the latest acceleration sample (for UI feedback). */
  intensity: number;
}

const STEP_THRESHOLD = 1.2; // m/s^2 above the smoothed baseline to count a peak
const STEP_COOLDOWN_MS = 280; // min time between detected steps (fast walk ~210ms)
const GRAVITY = 9.81;

export function useStepTracker() {
  const [state, setState] = useState<StepState>({
    steps: 0,
    permission: 'unknown',
    active: false,
    intensity: 0,
  });

  const baselineRef = useRef(GRAVITY);
  const lastPeakAtRef = useRef(0);
  const stepsRef = useRef(0);
  const activeRef = useRef(false);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const accel = event.accelerationIncludingGravity;
    if (!accel) return;
    const x = accel.x ?? 0;
    const y = accel.y ?? 0;
    const z = accel.z ?? 0;
    const mag = Math.sqrt(x * x + y * y + z * z);

    // Exponential smoothing of the baseline so the threshold adapts to
    // device orientation and slow drift.
    baselineRef.current = baselineRef.current * 0.9 + mag * 0.1;
    const delta = Math.abs(mag - baselineRef.current);

    setState((prev) => ({ ...prev, intensity: delta }));

    const now = Date.now();
    if (
      delta > STEP_THRESHOLD &&
      now - lastPeakAtRef.current > STEP_COOLDOWN_MS
    ) {
      lastPeakAtRef.current = now;
      stepsRef.current += 1;
      setState((prev) => ({ ...prev, steps: stepsRef.current }));
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('devicemotion', handleMotion);
    activeRef.current = false;
    setState((prev) => ({ ...prev, active: false }));
  }, [handleMotion]);

  const requestPermissionAndStart = useCallback(async () => {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
      setState((prev) => ({ ...prev, permission: 'unsupported' }));
      return;
    }

    const Ctor = DeviceMotionEvent as DeviceMotionConstructor;
    // iOS 13+ requires an explicit permission request from a user gesture.
    if (typeof Ctor.requestPermission === 'function') {
      try {
        const result = await Ctor.requestPermission();
        if (result !== 'granted') {
          setState((prev) => ({ ...prev, permission: 'denied' }));
          return;
        }
      } catch {
        setState((prev) => ({ ...prev, permission: 'denied' }));
        return;
      }
    }

    window.addEventListener('devicemotion', handleMotion);
    activeRef.current = true;
    setState((prev) => ({ ...prev, permission: 'granted', active: true }));
  }, [handleMotion]);

  const reset = useCallback(() => {
    stepsRef.current = 0;
    lastPeakAtRef.current = 0;
    setState((prev) => ({ ...prev, steps: 0 }));
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [handleMotion]);

  return { ...state, requestPermissionAndStart, stop, reset };
}
