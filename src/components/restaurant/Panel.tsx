import Link from "next/link";

// Generic card/panel wrapper, replacing the ad hoc
// "rounded-2xl border ... bg-white ... dark:bg-zinc-900" divs repeated
// across the entreprise pages. Uses the per-restaurant --theme-card /
// --theme-card-fg CSS variables set by restaurant/(app)/layout.tsx, with
// safe fallbacks so it still renders correctly outside that layout.
export function Panel({
  title,
  actionLabel,
  actionHref,
  className = "",
  bodyClassName = "",
  children,
}: {
  title?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-black/5 bg-[var(--theme-card,#fff)] text-[var(--theme-card-fg,#18181b)] shadow-sm ${className}`}
    >
      {(title || actionLabel) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          {title && <h2 className="font-bold tracking-tight">{title}</h2>}
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
