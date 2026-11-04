interface EcgWaveformProps {
  samples: number[];
  active: boolean;
}

const WIDTH = 240;
const HEIGHT = 64;

export default function EcgWaveform({ samples, active }: EcgWaveformProps) {
  const points = samples.length > 1
    ? samples
        .map((v, i) => {
          const x = (i / (samples.length - 1)) * WIDTH;
          const y = HEIGHT / 2 - Math.max(-1, Math.min(1, v)) * (HEIGHT / 2 - 4);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ')
    : `0,${HEIGHT / 2} ${WIDTH},${HEIGHT / 2}`;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-white/5 bg-black/30">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
        <line x1="0" x2={WIDTH} y1={HEIGHT / 2} y2={HEIGHT / 2} stroke="rgba(248,113,113,0.15)" strokeWidth="1" />
        <polyline
          points={points}
          fill="none"
          stroke={active ? '#f87171' : 'rgba(248,113,113,0.35)'}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {!active && samples.length === 0 && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/30">
          Live ECG appears during a scan
        </span>
      )}
    </div>
  );
}
