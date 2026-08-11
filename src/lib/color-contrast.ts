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
