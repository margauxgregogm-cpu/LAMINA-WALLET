import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseSerialNumber } from "@/lib/apple-wallet-auth";

type Params = { deviceLibraryIdentifier: string; passTypeIdentifier: string };

// iOS polls this periodically (as a fallback to push) to ask "which of my
// registered passes changed since this tag". Tags here are just ISO
// timestamps -- Apple treats them as opaque strings, so that's fine.
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
  const since = request.nextUrl.searchParams.get("passesUpdatedSince");

  const { data: registrations } = await supabaseAdmin
    .from("apple_wallet_registrations")
    .select("serial_number")
    .eq("device_library_identifier", deviceLibraryIdentifier)
    .eq("pass_type_identifier", passTypeIdentifier);

  if (!registrations || registrations.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = registrations
    .map((r) => ({ serialNumber: r.serial_number, ids: parseSerialNumber(r.serial_number) }))
    .filter((r): r is { serialNumber: string; ids: { restaurantId: string; clientId: string } } => r.ids !== null);

  const restaurantIds = [...new Set(parsed.map((p) => p.ids.restaurantId))];
  const clientIds = parsed.map((p) => p.ids.clientId);

  const [{ data: restaurants }, { data: clients }] = await Promise.all([
    supabaseAdmin.from("restaurants").select("id, updated_at").in("id", restaurantIds),
    supabaseAdmin.from("clients").select("id, last_visit_at, stamps_updated_at").in("id", clientIds),
  ]);

  const restaurantUpdatedAt = new Map((restaurants ?? []).map((r) => [r.id, r.updated_at]));
  const clientLastVisitAt = new Map((clients ?? []).map((c) => [c.id, c.last_visit_at]));
  // See migration 020_free_stamp_management.sql: gestion-libre stamp
  // adjustments never touch last_visit_at on purpose (they aren't real
  // visits), so without this the device's own periodic "what changed"
  // check -- independent of the APNs push -- never sees them and the pass
  // never gets re-fetched. Purely additive: passes driven by last_visit_at
  // (scan/recherche/fiche client +1) are unaffected.
  const clientStampsUpdatedAt = new Map((clients ?? []).map((c) => [c.id, c.stamps_updated_at]));

  const sinceMs = since ? Date.parse(since) : 0;

  const changed = parsed.filter(({ ids }) => {
    const restaurantMs = Date.parse(restaurantUpdatedAt.get(ids.restaurantId) ?? "") || 0;
    const clientMs = Date.parse(clientLastVisitAt.get(ids.clientId) ?? "") || 0;
    const stampsMs = Date.parse(clientStampsUpdatedAt.get(ids.clientId) ?? "") || 0;
    return Math.max(restaurantMs, clientMs, stampsMs) > sinceMs;
  });

  if (changed.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json({
    serialNumbers: changed.map((c) => c.serialNumber),
    lastUpdated: new Date().toISOString(),
  });
}
