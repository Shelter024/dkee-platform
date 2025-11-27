// Utility to generate a simple SVG cover image based on vehicle details.
// This avoids external API dependencies and provides a deterministic placeholder.
// The SVG includes a stylized car silhouette whose primary color matches the vehicle color (if provided)
// and overlays text with make / model / year.

export interface VehicleSummary {
  make: string;
  model: string;
  year: number;
  color?: string | null;
}

function normalizeColor(raw?: string | null): string {
  if (!raw) return '#3949ab'; // fallback brand navy
  const cleaned = raw.trim().toLowerCase();
  const named: Record<string, string> = {
    red: '#d32f2f',
    blue: '#1e3a8a',
    navy: '#283593',
    black: '#111827',
    white: '#f1f5f9',
    silver: '#cbd5e1',
    gray: '#64748b',
    grey: '#64748b',
    green: '#166534',
    yellow: '#f59e0b',
    gold: '#b45309',
  };
  if (named[cleaned]) return named[cleaned];
  // If hex-like (#abc or #aabbcc)
  if (/^#?[0-9a-f]{3,6}$/i.test(cleaned)) {
    return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
  }
  return '#3949ab';
}

export function generateVehicleCoverBase64(vehicle: VehicleSummary): string {
  const color = normalizeColor(vehicle.color);
  const textColor = '#ffffff';
  const year = vehicle.year.toString();
  const label = `${vehicle.make} ${vehicle.model}`.slice(0, 28);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="360" viewBox="0 0 1200 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label} ${year}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}" />
      <stop offset="70%" stop-color="#ff9800" />
    </linearGradient>
    <linearGradient id="car" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${color}" />
      <stop offset="100%" stop-color="#222" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgba(0,0,0,0.35)" />
    </filter>
  </defs>
  <rect width="1200" height="360" fill="url(#bg)" />
  <g filter="url(#shadow)">
    <rect x="160" y="160" width="880" height="90" rx="45" fill="url(#car)" />
    <circle cx="320" cy="255" r="40" fill="#111" />
    <circle cx="880" cy="255" r="40" fill="#111" />
    <circle cx="320" cy="255" r="26" fill="#eee" />
    <circle cx="880" cy="255" r="26" fill="#eee" />
    <path d="M250 160 L380 120 L820 120 L960 160 Z" fill="url(#car)" />
    <rect x="400" y="130" width="380" height="40" rx="6" fill="${textColor}22" />
  </g>
  <text x="50%" y="70%" text-anchor="middle" font-family="'Inter',system-ui,sans-serif" font-size="42" fill="${textColor}" font-weight="600">${label}</text>
  <text x="50%" y="82%" text-anchor="middle" font-family="'Inter',system-ui,sans-serif" font-size="28" fill="${textColor}CC" font-weight="500">${year}</text>
</svg>`;
  let base64 = '';
  try {
    // @ts-ignore Buffer may be available in some runtimes
    if (typeof Buffer !== 'undefined') {
      // @ts-ignore
      base64 = Buffer.from(svg).toString('base64');
    } else {
      throw new Error('No Buffer');
    }
  } catch {
    if (typeof window !== 'undefined') {
      base64 = btoa(unescape(encodeURIComponent(svg)));
    }
  }
  return `data:image/svg+xml;base64,${base64}`;
}
