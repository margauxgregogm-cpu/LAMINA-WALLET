import Link from "next/link";
import type { IconName } from "./nav-items";
import { NavIcon } from "./NavIcon";

// Compact on phones (icon above the number, centred) so three tiles fit on
// one row without scrolling, and a roomier icon-beside-number row from sm up.
export function KpiTile({
  label,
  value,
  sublabel,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: IconName;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--theme-accent-soft,#e6f6f0)] text-[var(--theme-accent-strong,#059669)] sm:h-12 sm:w-12">
        <NavIcon name={icon} className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>
      <div className="min-w-0 text-center sm:text-left">
        <div className="truncate text-xs opacity-60 sm:text-sm">{label}</div>
        <div className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">{value}</div>
        {sublabel && <div className="truncate text-[11px] opacity-50">{sublabel}</div>}
      </div>
    </>
  );

  const className =
    "flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-[var(--theme-card,#fff)] p-3 text-[var(--theme-card-fg,#18181b)] shadow-sm sm:flex-row sm:gap-3 sm:p-4" +
    (href ? " transition-shadow hover:shadow-md" : "");

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
