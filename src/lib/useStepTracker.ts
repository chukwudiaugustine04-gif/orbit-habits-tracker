import { useCallback, useEffect, useRef, useState } from 'react';

type DeviceMotionConstructor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export type StepPermission = 'unknown' | 'needed' | 'granted' | 'denied' | 'unsupported';

interface StepState {
  steps: number;
  permission: StepPermission;
  active: boolean;
  intensity: number;
  distanceKm: number;
  calories: number;
}

const STEP_THRESHOLD = 1.2;
const STEP_COOLDOWN_MS = 280;
const GRAVITY = 9.81;
const STRIDE_METERS = 0.7;
const CALORIES_PER_STEP = 0.04;

export function useStepTracker() {
  const [state, setState] = useState<StepState>({
    steps: 0,
    permission: 'unknown',
    active: false,
    intensity: 0,
    distanceKm: 0,
    calories: 0,
  });

  const baselineRef = useRef(GRAVITY);
  const lastPeakAtRef = useRef(0);
  const stepsRef = useRef(0);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const accel = event.accelerationIncludingGravity;
    if (!accel) return;
    const x = accel.x ?? 0;
    const y = accel.y ?? 0;
    const z = accel.z ?? 0;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    baselineRef.current = baselineRef.current * 0.9 + magnitude * 0.1;
    const delta = Math.abs(magnitude - baselineRef.current);
    setState((prev) => ({ ...prev, intensity: delta }));

    const now = Date.now();
    if (delta <= STEP_THRESHOLD || now - lastPeakAtRef.current <= STEP_COOLDOWN_MS) return;
    lastPeakAtRef.current = now;
    stepsRef.current += 1;
    const steps = stepsRef.current;
    setState((prev) => ({
      ...prev,
      steps,
      distanceKm: (steps * STRIDE_METERS) / 1000,
      calories: Math.round(steps * CALORIES_PER_STEP),
    }));
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('devicemotion', handleMotion);
    setState((prev) => ({ ...prev, active: false }));
  }, [handleMotion]);

  const requestPermissionAndStart = useCallback(async () => {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
      setState((prev) => ({ ...prev, permission: 'unsupported' }));
      return;
    }

    const Ctor = DeviceMotionEvent as DeviceMotionConstructor;
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
    setState((prev) => ({ ...prev, permission: 'granted', active: true }));
  }, [handleMotion]);

  const reset = useCallback(() => {
    stepsRef.current = 0;
    lastPeakAtRef.current = 0;
    setState((prev) => ({ ...prev, steps: 0, distanceKm: 0, calories: 0 }));
  }, []);

  useEffect(() => () => {
    if (typeof window !== 'undefined') window.removeEventListener('devicemotion', handleMotion);
  }, [handleMotion]);

  return { ...state, requestPermissionAndStart, stop, reset };
}
