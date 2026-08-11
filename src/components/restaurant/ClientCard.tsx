import Link from "next/link";
import { formatRelativeDate } from "@/lib/format-relative-date";
import { Panel } from "./Panel";

type Client = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  city: string | null;
  stamps: number;
  total_visits: number;
  is_vip: boolean;
  last_visit_at: string | null;
};

// Presentational-only client card for the new Clients/VIP list pages.
// Deliberately NOT reused by SearchClients.tsx or ScanClient.tsx -- those
// already have their own working stateful card markup (VIP toggle,
// add-visit, optimistic updates, inline error/outcome messages) and
// restyling them in place carries lower regression risk than threading
// all that state through a shared component under a redesign.
export function ClientCard({ client }: { client: Client }) {
  return (
    <Panel className="flex flex-col gap-2">
      <div>
        <Link
          href={`/restaurant/clients/${client.id}`}
          className="font-semibold underline-offset-2 hover:underline"
        >
          {client.first_name} {client.last_name} {client.is_vip && <span title="VIP">⭐</span>}
        </Link>
        <div className="text-sm text-[var(--theme-card-fg,#18181b)]/70">
          {client.email}
          {client.city ? ` · ${client.city}` : ""}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--theme-card-fg,#18181b)]/70">
        <span>Tampons : {client.stamps}</span>
        <span>Visites totales : {client.total_visits}</span>
        <span>Dernière visite : {formatRelativeDate(client.last_visit_at)}</span>
      </div>
    </Panel>
  );
}
