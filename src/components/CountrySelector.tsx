import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { countryCodes, type CountryCode } from '@/lib/countryCodes';

interface CountrySelectorProps {
  selected: CountryCode;
  onSelect: (country: CountryCode) => void;
}

export default function CountrySelector({ selected, onSelect }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = countryCodes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search)
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-full items-center gap-2 whitespace-nowrap rounded-l-xl border-r border-white/10 px-3.5 text-sm text-white transition-colors hover:bg-white/5"
      >
        <span className="text-lg">{selected.flag}</span>
        <span className="font-medium">{selected.dialCode}</span>
        <ChevronDown
          size={16}
          className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-xl border border-white/10 bg-[#121828] p-2 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <Search size={14} className="text-white/30" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder-white/25"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((country) => (
              <button
                key={`${country.code}-${country.dialCode}-${country.name}`}
                onClick={() => {
                  onSelect(country);
                  setOpen(false);
                  setSearch('');
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selected.code === country.code && selected.dialCode === country.dialCode
                    ? 'bg-cyan-500/15 text-cyan-300'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <span className="flex-1">{country.name}</span>
                <span className="text-white/40">{country.dialCode}</span>
                {selected.code === country.code && selected.dialCode === country.dialCode && (
                  <Check size={14} className="text-cyan-400" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-white/30">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
