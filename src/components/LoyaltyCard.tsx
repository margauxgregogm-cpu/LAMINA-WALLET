import { hexToRgb, relativeLuminance, darken } from "@/lib/color-contrast";

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
  textColor,
  stampDisplayStyle = "color",
  stampColor,
  stampImageUrl,
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
  /** Mirrors the Apple Wallet pass's foregroundColor/labelColor (see
   * migration 016_wallet_text_color.sql) so this web preview matches what
   * the customer actually gets. Only overrides the reward text, member
   * name, and stamp progress ("3/10") plus their captions -- restaurant
   * name and the stamp circles keep their normal auto-contrast/fixed
   * colors regardless. Omitted (not defaulted here) when unset, so
   * restaurants without a configured color render exactly as before. */
  textColor?: string | null;
  /** See migration 021_stamp_display_style.sql. Defaults to "color" so
   * restaurants that predate this option render exactly as before. */
  stampDisplayStyle?: "color" | "image" | "counter" | null;
  stampColor?: string | null;
  stampImageUrl?: string | null;
}) {
  // stampsRequired = 0 means this card has no stamp program at all -- never
  // show a meaningless "0/0" or an empty circle row, everything else on the
  // card (logo, reward, member) still renders normally.
  const hasStampProgram = stampsRequired > 0;
  const showCircles = hasStampProgram && stampDisplayStyle !== "counter";
  const stamps = showCircles ? Array.from({ length: stampsRequired }, (_, i) => i < stampsEarned) : [];
  const hasImage = Boolean(backgroundImageUrl);
  const filledStampColor = stampColor || "#10b981";

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
        {hasStampProgram && (
          <div className="text-right">
            <div
              className={`text-xs uppercase tracking-wide ${textColor ? "" : subtext}`}
              style={textColor ? { color: textColor } : undefined}
            >
              Tampons
            </div>
            <div className="text-xl font-semibold" style={textColor ? { color: textColor } : undefined}>
              {stampsEarned} / {stampsRequired}
            </div>
          </div>
        )}
      </div>

      {showCircles && (
        <div className="mt-8 flex flex-wrap gap-3">
          {stamps.map((filled, i) => (
            <div
              key={i}
              className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ${
                filled ? "text-white" : `border-2 ${stampEmpty}`
              }`}
              style={
                filled
                  ? {
                      backgroundColor: filledStampColor,
                      ...(stampDisplayStyle === "image" && stampImageUrl
                        ? {
                            backgroundImage: `url(${stampImageUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : {}),
                    }
                  : undefined
              }
            >
              {filled && stampDisplayStyle !== "image" && (
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
      )}

      <div className="mt-8 flex items-end justify-between">
        <div>
          <div
            className={`text-xs uppercase tracking-wide ${textColor ? "" : subtext}`}
            style={textColor ? { color: textColor } : undefined}
          >
            Récompense
          </div>
          <div className="font-semibold" style={textColor ? { color: textColor } : undefined}>
            {rewardText}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-xs uppercase tracking-wide ${textColor ? "" : subtext}`}
            style={textColor ? { color: textColor } : undefined}
          >
            Membre
          </div>
          <div className="font-semibold" style={textColor ? { color: textColor } : undefined}>
            {memberName}
          </div>
        </div>
      </div>
    </div>
  );
}
