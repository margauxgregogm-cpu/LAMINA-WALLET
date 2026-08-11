import { Panel } from "./Panel";

export function KpiTile({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <Panel className="flex flex-col gap-1">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-sm text-[var(--theme-card-fg,#18181b)]/70">{label}</div>
      {sublabel && <div className="text-xs text-[var(--theme-card-fg,#18181b)]/50">{sublabel}</div>}
    </Panel>
  );
}
