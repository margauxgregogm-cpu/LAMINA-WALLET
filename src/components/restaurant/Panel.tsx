// Generic card/panel wrapper, replacing the ad hoc
// "rounded-2xl border ... bg-white ... dark:bg-zinc-900" divs repeated
// across the entreprise pages. Uses the per-restaurant --theme-card /
// --theme-card-fg CSS variables set by restaurant/(app)/layout.tsx, with
// safe fallbacks so it still renders correctly outside that layout (e.g.
// if ever reused elsewhere) or before the variables are set.
export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-black/10 bg-[var(--theme-card,#fff)] p-5 text-[var(--theme-card-fg,#18181b)] shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
