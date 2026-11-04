import { useMemo } from 'react';

interface DigitalTimeInputProps {
  value: string;
  onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function parse(value: string) {
  const [h24, m] = value.split(':').map(Number);
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour12, minute: m, period };
}

function toValue(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  const h24 = (hour12 % 12) + (period === 'PM' ? 12 : 0);
  return `${h24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

const selectClass =
  'w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-base font-semibold tabular-nums text-white outline-none transition-all hover:border-white/20 focus:border-cyan-400/50 focus:bg-white/[0.07]';

export default function DigitalTimeInput({ value, onChange }: DigitalTimeInputProps) {
  const { hour12, minute, period } = useMemo(() => parse(value), [value]);
  const minuteOptions = useMemo(
    () => (MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort((a, b) => a - b)),
    [minute]
  );

  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
      <select
        aria-label="Hour"
        value={hour12}
        onChange={(e) => onChange(toValue(Number(e.target.value), minute, period))}
        className={selectClass}
      >
        {HOURS.map((h) => (
          <option key={h} value={h} className="bg-[#0f1424]">
            {h.toString().padStart(2, '0')}
          </option>
        ))}
      </select>

      <select
        aria-label="Minute"
        value={minute}
        onChange={(e) => onChange(toValue(hour12, Number(e.target.value), period))}
        className={selectClass}
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m} className="bg-[#0f1424]">
            {m.toString().padStart(2, '0')}
          </option>
        ))}
      </select>

      <div role="radiogroup" aria-label="AM or PM" className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {(['AM', 'PM'] as const).map((p) => {
          const active = period === p;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(toValue(hour12, minute, p))}
              className={`px-3 text-xs font-bold tracking-wide transition-all ${
                active
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}
