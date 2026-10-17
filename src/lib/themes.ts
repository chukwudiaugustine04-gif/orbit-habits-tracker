export type ThemeId =
  | 'dark-space'
  | 'executive-gold'
  | 'emerald-discipline'
  | 'minimalist-crisp'
  | 'midnight-executive'
  | 'obsidian-minimal'
  | 'cyberpunk-neon'
  | 'nordic-frost'
  | 'solarized-ember'
  | 'amethyst-dream'
  | 'custom';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string[];
  vars: Record<string, string>;
  isCustom?: boolean;
}

export const themes: Theme[] = [
  {
    id: 'dark-space',
    name: 'Orbit Dark Space',
    description: 'Deep space navy with cyan accents',
    swatch: ['#0a0e1a', '#22d3ee', '#34d399'],
    vars: {
      '--bg-base': '#0a0e1a',
      '--bg-card': 'rgba(255,255,255,0.03)',
      '--bg-card-hover': 'rgba(255,255,255,0.06)',
      '--border-subtle': 'rgba(255,255,255,0.1)',
      '--border-active': 'rgba(34,211,238,0.4)',
      '--text-primary': '#ffffff',
      '--text-secondary': 'rgba(255,255,255,0.5)',
      '--text-muted': 'rgba(255,255,255,0.3)',
      '--accent-primary': '#22d3ee',
      '--accent-secondary': '#34d399',
      '--accent-glow': 'rgba(34,211,238,0.12)',
      '--header-bg': 'rgba(10,14,26,0.9)',
    },
  },
  {
    id: 'executive-gold',
    name: 'Executive Gold',
    description: 'Charcoal black with warm gold highlights',
    swatch: ['#1a1610', '#d4a44c', '#e8c878'],
    vars: {
      '--bg-base': '#1a1610',
      '--bg-card': 'rgba(255,255,255,0.03)',
      '--bg-card-hover': 'rgba(255,255,255,0.06)',
      '--border-subtle': 'rgba(212,164,76,0.15)',
      '--border-active': 'rgba(212,164,76,0.4)',
      '--text-primary': '#f5f0e0',
      '--text-secondary': 'rgba(245,240,224,0.5)',
      '--text-muted': 'rgba(245,240,224,0.3)',
      '--accent-primary': '#d4a44c',
      '--accent-secondary': '#e8c878',
      '--accent-glow': 'rgba(212,164,76,0.12)',
      '--header-bg': 'rgba(26,22,16,0.9)',
    },
  },
  {
    id: 'emerald-discipline',
    name: 'Emerald Discipline',
    description: 'Forest dark with emerald green focus',
    swatch: ['#0d1a14', '#10b981', '#34d399'],
    vars: {
      '--bg-base': '#0d1a14',
      '--bg-card': 'rgba(255,255,255,0.03)',
      '--bg-card-hover': 'rgba(255,255,255,0.06)',
      '--border-subtle': 'rgba(16,185,129,0.15)',
      '--border-active': 'rgba(16,185,129,0.4)',
      '--text-primary': '#ecfdf5',
      '--text-secondary': 'rgba(236,253,245,0.5)',
      '--text-muted': 'rgba(236,253,245,0.3)',
      '--accent-primary': '#10b981',
      '--accent-secondary': '#34d399',
      '--accent-glow': 'rgba(16,185,129,0.12)',
      '--header-bg': 'rgba(13,26,20,0.9)',
    },
  },
  {
    id: 'minimalist-crisp',
    name: 'Minimalist Crisp',
    description: 'Light pearl with slate blue accents',
    swatch: ['#f5f6f8', '#3b82f6', '#64748b'],
    vars: {
      '--bg-base': '#f5f6f8',
      '--bg-card': 'rgba(255,255,255,0.8)',
      '--bg-card-hover': 'rgba(255,255,255,0.95)',
      '--border-subtle': 'rgba(0,0,0,0.08)',
      '--border-active': 'rgba(59,130,246,0.3)',
      '--text-primary': '#1e293b',
      '--text-secondary': 'rgba(30,41,59,0.55)',
      '--text-muted': 'rgba(30,41,59,0.35)',
      '--accent-primary': '#3b82f6',
      '--accent-secondary': '#64748b',
      '--accent-glow': 'rgba(59,130,246,0.08)',
      '--header-bg': 'rgba(245,246,248,0.9)',
    },
  },
  {
    id: 'midnight-executive',
    name: 'Midnight Executive',
    description: 'Pure midnight with platinum silver accents',
    swatch: ['#08090f', '#c0c8d4', '#8b94a3'],
    vars: {
      '--bg-base': '#08090f',
      '--bg-card': 'rgba(255,255,255,0.04)',
      '--bg-card-hover': 'rgba(255,255,255,0.07)',
      '--border-subtle': 'rgba(192,200,212,0.12)',
      '--border-active': 'rgba(192,200,212,0.4)',
      '--text-primary': '#eef2f7',
      '--text-secondary': 'rgba(238,242,247,0.5)',
      '--text-muted': 'rgba(238,242,247,0.3)',
      '--accent-primary': '#c0c8d4',
      '--accent-secondary': '#8b94a3',
      '--accent-glow': 'rgba(192,200,212,0.1)',
      '--header-bg': 'rgba(8,9,15,0.9)',
    },
  },
  {
    id: 'obsidian-minimal',
    name: 'Obsidian Minimal',
    description: 'Black volcanic glass with muted teal',
    swatch: ['#0c0c0d', '#4fd1c5', '#71717a'],
    vars: {
      '--bg-base': '#0c0c0d',
      '--bg-card': 'rgba(255,255,255,0.03)',
      '--bg-card-hover': 'rgba(255,255,255,0.06)',
      '--border-subtle': 'rgba(113,113,122,0.18)',
      '--border-active': 'rgba(79,209,197,0.35)',
      '--text-primary': '#fafafa',
      '--text-secondary': 'rgba(250,250,250,0.5)',
      '--text-muted': 'rgba(250,250,250,0.3)',
      '--accent-primary': '#4fd1c5',
      '--accent-secondary': '#71717a',
      '--accent-glow': 'rgba(79,209,197,0.1)',
      '--header-bg': 'rgba(12,12,13,0.92)',
    },
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Inky black with electric magenta and lime',
    swatch: ['#0a0014', '#ff2e88', '#aaff00'],
    vars: {
      '--bg-base': '#0a0014',
      '--bg-card': 'rgba(255,46,136,0.04)',
      '--bg-card-hover': 'rgba(255,46,136,0.08)',
      '--border-subtle': 'rgba(255,46,136,0.15)',
      '--border-active': 'rgba(255,46,136,0.5)',
      '--text-primary': '#fce7f3',
      '--text-secondary': 'rgba(252,231,243,0.5)',
      '--text-muted': 'rgba(252,231,243,0.3)',
      '--accent-primary': '#ff2e88',
      '--accent-secondary': '#aaff00',
      '--accent-glow': 'rgba(255,46,136,0.18)',
      '--header-bg': 'rgba(10,0,20,0.9)',
    },
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    description: 'Glacial blue-grey with frost cyan',
    swatch: ['#0e1620', '#7dd3fc', '#bae6fd'],
    vars: {
      '--bg-base': '#0e1620',
      '--bg-card': 'rgba(186,230,253,0.04)',
      '--bg-card-hover': 'rgba(186,230,253,0.07)',
      '--border-subtle': 'rgba(125,211,252,0.15)',
      '--border-active': 'rgba(125,211,252,0.4)',
      '--text-primary': '#f0f9ff',
      '--text-secondary': 'rgba(240,249,255,0.5)',
      '--text-muted': 'rgba(240,249,255,0.3)',
      '--accent-primary': '#7dd3fc',
      '--accent-secondary': '#bae6fd',
      '--accent-glow': 'rgba(125,211,252,0.12)',
      '--header-bg': 'rgba(14,22,32,0.9)',
    },
  },
  {
    id: 'solarized-ember',
    name: 'Solarized Ember',
    description: 'Warm dark amber with solar orange glow',
    swatch: ['#1c1108', '#f59e0b', '#fbbf24'],
    vars: {
      '--bg-base': '#1c1108',
      '--bg-card': 'rgba(245,158,11,0.04)',
      '--bg-card-hover': 'rgba(245,158,11,0.07)',
      '--border-subtle': 'rgba(245,158,11,0.15)',
      '--border-active': 'rgba(245,158,11,0.4)',
      '--text-primary': '#fff7ed',
      '--text-secondary': 'rgba(255,247,237,0.5)',
      '--text-muted': 'rgba(255,247,237,0.3)',
      '--accent-primary': '#f59e0b',
      '--accent-secondary': '#fbbf24',
      '--accent-glow': 'rgba(245,158,11,0.14)',
      '--header-bg': 'rgba(28,17,8,0.9)',
    },
  },
  {
    id: 'amethyst-dream',
    name: 'Amethyst Dream',
    description: 'Deep violet night with soft amethyst accents',
    swatch: ['#13091f', '#a78bfa', '#c4b5fd'],
    vars: {
      '--bg-base': '#13091f',
      '--bg-card': 'rgba(167,139,250,0.04)',
      '--bg-card-hover': 'rgba(167,139,250,0.07)',
      '--border-subtle': 'rgba(167,139,250,0.15)',
      '--border-active': 'rgba(167,139,250,0.4)',
      '--text-primary': '#f5f3ff',
      '--text-secondary': 'rgba(245,243,255,0.5)',
      '--text-muted': 'rgba(245,243,255,0.3)',
      '--accent-primary': '#a78bfa',
      '--accent-secondary': '#c4b5fd',
      '--accent-glow': 'rgba(167,139,250,0.14)',
      '--header-bg': 'rgba(19,9,31,0.9)',
    },
  },
];

const CUSTOM_THEME_KEY = 'orbit-custom-theme';

export function applyTheme(themeId: ThemeId) {
  if (themeId === 'custom') {
    const saved = loadCustomTheme();
    if (saved) {
      applyThemeVars(saved.vars);
      document.documentElement.setAttribute('data-theme', 'custom');
      return;
    }
  }
  const theme = themes.find((t) => t.id === themeId) || themes[0];
  applyThemeVars(theme.vars);
  document.documentElement.setAttribute('data-theme', themeId);
}

function applyThemeVars(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function getThemeById(id: ThemeId): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}

export function loadCustomTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Theme;
    if (!parsed.vars) return null;
    return { ...parsed, id: 'custom', isCustom: true };
  } catch {
    return null;
  }
}

export function saveCustomTheme(theme: Theme) {
  const customTheme: Theme = { ...theme, id: 'custom', isCustom: true };
  localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(customTheme));
}

export function clearCustomTheme() {
  localStorage.removeItem(CUSTOM_THEME_KEY);
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Generates a Theme from an image by sampling pixels on a canvas.
 * Derives background, accent, text, and border colors from the image palette.
 * Returns a Theme with id 'custom' that can be applied and saved.
 */
export async function generateThemeFromImage(file: File): Promise<Theme> {
  const imageUrl = URL.createObjectURL(file);
  const img = await loadImage(imageUrl);
  URL.revokeObjectURL(imageUrl);

  // Downscale to a small canvas for fast sampling
  const sampleSize = 32;
  const canvas = document.createElement('canvas');
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

  // Collect pixel colors, bucket by quantization to find dominant tones
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];
    if (a < 128) continue;
    // Quantize to 4 bits per channel to group similar colors
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const sorted = [...buckets.values()]
    .map((b) => ({
      r: Math.round(b.r / b.count),
      g: Math.round(b.g / b.count),
      b: Math.round(b.b / b.count),
      count: b.count,
      lum: luminance(Math.round(b.r / b.count), Math.round(b.g / b.count), Math.round(b.b / b.count)),
    }))
    .sort((a, b) => b.count - a.count);

  // Darkest color → background base
  const darkest = [...sorted].sort((a, b) => a.lum - b.lum)[0] || { r: 10, g: 14, b: 26, lum: 0.05 };
  const bgHex = rgbToHex(darkest.r, darkest.g, darkest.b);

  // Most saturated / vivid mid-tone → accent primary
  const vivid = sorted
    .filter((c) => c.lum > 0.15 && c.lum < 0.85)
    .map((c) => {
      const max = Math.max(c.r, c.g, c.b);
      const min = Math.min(c.r, c.g, c.b);
      const sat = max === 0 ? 0 : (max - min) / max;
      return { ...c, sat };
    })
    .sort((a, b) => b.sat - a.sat)[0];
  const accentHex = vivid
    ? rgbToHex(vivid.r, vivid.g, vivid.b)
    : rgbToHex(34, 211, 238);

  // A secondary accent — second most vivid, or a lightened version
  const vivid2 = sorted
    .filter((c) => c.lum > 0.15 && c.lum < 0.9)
    .map((c) => {
      const max = Math.max(c.r, c.g, c.b);
      const min = Math.min(c.r, c.g, c.b);
      const sat = max === 0 ? 0 : (max - min) / max;
      return { ...c, sat };
    })
    .sort((a, b) => b.sat - a.sat)[1];
  const accent2Hex = vivid2
    ? rgbToHex(vivid2.r, vivid2.g, vivid2.b)
    : rgbToHex(52, 211, 153);

  // Lightest color → text primary (ensure contrast vs bg)
  const lightest = [...sorted].sort((a, b) => b.lum - a.lum)[0] || { r: 255, g: 255, b: 255, lum: 1 };
  const textHex = lightest.lum > 0.6
    ? rgbToHex(lightest.r, lightest.g, lightest.b)
    : '#ffffff';

  const isLightBg = darkest.lum > 0.5;
  const textSecondary = isLightBg
    ? `rgba(${Math.max(darkest.r - 40, 0)},${Math.max(darkest.g - 40, 0)},${Math.max(darkest.b - 40, 0)},0.55)`
    : `rgba(${Math.min(lightest.r + 10, 255)},${Math.min(lightest.g + 10, 255)},${Math.min(lightest.b + 10, 255)},0.5)`;
  const textMuted = isLightBg
    ? `rgba(${Math.max(darkest.r - 20, 0)},${Math.max(darkest.g - 20, 0)},${Math.max(darkest.b - 20, 0)},0.35)`
    : `rgba(${Math.min(lightest.r + 10, 255)},${Math.min(lightest.g + 10, 255)},${Math.min(lightest.b + 10, 255)},0.3)`;

  const bgCard = isLightBg ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)';
  const bgCardHover = isLightBg ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.06)';
  const borderSubtle = isLightBg ? 'rgba(0,0,0,0.08)' : hexToRgba(accentHex, 0.13);
  const borderActive = hexToRgba(accentHex, 0.4);
  const accentGlow = hexToRgba(accentHex, 0.13);
  const headerBg = isLightBg ? hexToRgba(bgHex, 0.9) : hexToRgba(bgHex, 0.9);

  return {
    id: 'custom',
    name: 'Custom (from image)',
    description: 'Generated from your photo',
    isCustom: true,
    swatch: [bgHex, accentHex, accent2Hex],
    vars: {
      '--bg-base': bgHex,
      '--bg-card': bgCard,
      '--bg-card-hover': bgCardHover,
      '--border-subtle': borderSubtle,
      '--border-active': borderActive,
      '--text-primary': textHex,
      '--text-secondary': textSecondary,
      '--text-muted': textMuted,
      '--accent-primary': accentHex,
      '--accent-secondary': accent2Hex,
      '--accent-glow': accentGlow,
      '--header-bg': headerBg,
    },
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
