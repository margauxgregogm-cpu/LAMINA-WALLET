import type { IconName } from "./nav-items";
import { NavIcon } from "./NavIcon";

export function KpiTile({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: IconName;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-[var(--theme-card,#fff)] p-5 text-[var(--theme-card-fg,#18181b)] shadow-sm">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--theme-accent-soft,#e6f6f0)] text-[var(--theme-accent-strong,#059669)]">
        <NavIcon name={icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm opacity-60">{label}</div>
        <div className="text-3xl font-bold leading-tight tracking-tight">{value}</div>
        {sublabel && <div className="truncate text-xs opacity-50">{sublabel}</div>}
      </div>
    </div>
  );
}
