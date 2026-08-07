type ColorTheme = "anthracite" | "white" | "gray" | "navy";

const THEMES: Record<
  ColorTheme,
  { bg: string; text: string; subtext: string; stampEmpty: string }
> = {
  anthracite: {
    bg: "bg-gradient-to-b from-zinc-800 to-zinc-900",
    text: "text-white",
    subtext: "text-zinc-400",
    stampEmpty: "border-zinc-600",
  },
  white: {
    bg: "bg-white border border-zinc-200",
    text: "text-zinc-900",
    subtext: "text-zinc-500",
    stampEmpty: "border-zinc-300",
  },
  gray: {
    bg: "bg-gradient-to-b from-zinc-500 to-zinc-600",
    text: "text-white",
    subtext: "text-zinc-200",
    stampEmpty: "border-zinc-400",
  },
  navy: {
    bg: "bg-gradient-to-b from-blue-950 to-slate-900",
    text: "text-white",
    subtext: "text-blue-200/70",
    stampEmpty: "border-blue-800",
  },
};

export function LoyaltyCard({
  restaurantName,
  logoInitials,
  logoUrl,
  stampsEarned,
  stampsRequired,
  rewardText,
  memberName,
  colorTheme = "anthracite",
}: {
  restaurantName: string;
  logoInitials: string;
  logoUrl?: string | null;
  stampsEarned: number;
  stampsRequired: number;
  rewardText: string;
  memberName: string;
  colorTheme?: ColorTheme;
}) {
  const theme = THEMES[colorTheme];
  const stamps = Array.from({ length: stampsRequired }, (_, i) => i < stampsEarned);

  return (
    <div
      className={`w-full max-w-md rounded-3xl p-6 shadow-xl ${theme.bg} ${theme.text}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl font-semibold ${
              logoUrl
                ? ""
                : colorTheme === "white"
                  ? "bg-zinc-900 text-white"
                  : "bg-white/10"
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
            <div className={`text-sm ${theme.subtext}`}>Carte de fidélité</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs uppercase tracking-wide ${theme.subtext}`}>
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
                : `border-2 ${theme.stampEmpty}`
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
          <div className={`text-xs uppercase tracking-wide ${theme.subtext}`}>
            Récompense
          </div>
          <div className="font-semibold">{rewardText}</div>
        </div>
        <div className="text-right">
          <div className={`text-xs uppercase tracking-wide ${theme.subtext}`}>
            Membre
          </div>
          <div className="font-semibold">{memberName}</div>
        </div>
      </div>
    </div>
  );
}
