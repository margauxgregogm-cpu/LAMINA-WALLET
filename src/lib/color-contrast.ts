// Shared color-contrast helpers. Originally lived only inside LoyaltyCard
// (to pick light/dark text over an arbitrary restaurant-chosen background),
// extracted so the entreprise interface theme (sidebar/cards/text colors,
// also restaurant-chosen) can reuse the same WCAG-luminance-based logic
// instead of a second, possibly-diverging implementation.

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function darken([r, g, b]: [number, number, number], amount: number): string {
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `rgb(${d(r)}, ${d(g)}, ${d(b)})`;
}

// Blends a color toward a target (white/black) -- used to derive the whole
// entreprise interface palette (page background, sidebar, icon pills) from
// the single theme color an admin picks, so one choice tints the entire UI
// instead of just the active nav item.
function mixWith(hex: string, target: [number, number, number], ratio: number): string {
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number, t: number) => Math.round(c + (t - c) * ratio);
  return `rgb(${m(r, target[0])}, ${m(g, target[1])}, ${m(b, target[2])})`;
}

export function tint(hex: string, ratio: number): string {
  return mixWith(hex, [255, 255, 255], ratio);
}

export function shade(hex: string, ratio: number): string {
  return mixWith(hex, [0, 0, 0], ratio);
}

export function isLightColor(hex: string): boolean {
  return relativeLuminance(hexToRgb(hex)) > 0.55;
}

// Picks a readable foreground (text/icon) color for an arbitrary
// restaurant-chosen background color -- used by the entreprise shell to
// keep the sidebar/KPI cards legible regardless of how light or dark an
// admin picks the theme/card color to be.
export function pickForegroundColor(
  backgroundHex: string,
  { onLight = "#18181b", onDark = "#ffffff" }: { onLight?: string; onDark?: string } = {}
): string {
  return isLightColor(backgroundHex) ? onLight : onDark;
}
