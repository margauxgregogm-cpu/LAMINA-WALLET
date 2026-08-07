function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function darken([r, g, b]: [number, number, number], amount: number): string {
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `rgb(${d(r)}, ${d(g)}, ${d(b)})`;
}

export function LoyaltyCard({
  restaurantName,
  logoInitials,
  logoUrl,
  stampsEarned,
  stampsRequired,
  rewardText,
  memberName,
  backgroundColor = "#27272a",
  backgroundImageUrl,
}: {
  restaurantName: string;
  logoInitials: string;
  logoUrl?: string | null;
  stampsEarned: number;
  stampsRequired: number;
  rewardText: string;
  memberName: string;
  backgroundColor?: string;
  backgroundImageUrl?: string | null;
}) {
  const stamps = Array.from({ length: stampsRequired }, (_, i) => i < stampsEarned);
  const hasImage = Boolean(backgroundImageUrl);

  const rgb = hexToRgb(backgroundColor);
  const isLightBg = !hasImage && relativeLuminance(rgb) > 0.55;

  // Over a photo, always use light text on a dark scrim — reading contrast
  // against an arbitrary image can't be computed from a single color.
  const light = hasImage || !isLightBg;

  const text = light ? "text-white" : "text-zinc-900";
  const subtext = light ? "text-white/70" : "text-zinc-900/60";
  const stampEmpty = light ? "border-white/40" : "border-zinc-900/30";
  const badgeBg = light ? "bg-white/10" : "bg-zinc-900/10";

  const cardStyle = hasImage
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.55)), url(${backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: `linear-gradient(to bottom, ${backgroundColor}, ${darken(rgb, 0.18)})` };

  return (
    <div
      style={cardStyle}
      className={`w-full max-w-md rounded-3xl p-6 shadow-xl ${text}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl font-semibold ${
              logoUrl ? "" : badgeBg
            }`}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              logoInitials
            )}
          </div>
          <div>
            <div className="font-semibold uppercase tracking-wide">
              {restaurantName}
            </div>
            <div className={`text-sm ${subtext}`}>Carte de fidélité</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs uppercase tracking-wide ${subtext}`}>
            Tampons
          </div>
          <div className="text-xl font-semibold">
            {stampsEarned} / {stampsRequired}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {stamps.map((filled, i) => (
          <div
            key={i}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              filled
                ? "bg-emerald-500 text-white"
                : `border-2 ${stampEmpty}`
            }`}
          >
            {filled && (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div>
          <div className={`text-xs uppercase tracking-wide ${subtext}`}>
            Récompense
          </div>
          <div className="font-semibold">{rewardText}</div>
        </div>
        <div className="text-right">
          <div className={`text-xs uppercase tracking-wide ${subtext}`}>
            Membre
          </div>
          <div className="font-semibold">{memberName}</div>
        </div>
      </div>
    </div>
  );
}
