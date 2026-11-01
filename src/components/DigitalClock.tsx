import { useEffect, useState } from 'react';

export default function DigitalClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return (
    <div className="flex items-baseline gap-1 font-mono tabular-nums">
      <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {hour12}:{mm}
      </span>
      <span className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
        :{ss}
      </span>
      <span className="ml-1 text-sm font-bold tracking-wider" style={{ color: 'var(--accent-primary)' }}>
        {period}
      </span>
    </div>
  );
}
