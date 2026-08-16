import { NextResponse, type NextRequest } from "next/server";
import { buildAppleWalletPassForClient } from "@/lib/apple-wallet";
import { verifyAuthHeader, parseSerialNumber } from "@/lib/apple-wallet-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = { passTypeIdentifier: string; serialNumber: string };

// iOS calls this to fetch the latest version of a pass it already has,
// either after a push notification or on its own periodic schedule. Apple's
// device logs flagged an earlier version of this route for ignoring
// If-Modified-Since and always returning 200 with a fake "now" Last-Modified
// -- conditional GET is part of the spec, not an optimization, so a device
// checking whether it actually needs the new pass got the same answer every
// time either way.
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { serialNumber } = await params;

  if (!verifyAuthHeader(request.headers.get("authorization"), serialNumber)) {
    return new NextResponse(null, { status: 401 });
  }

  const ids = parseSerialNumber(serialNumber);
  if (!ids) {
    return new NextResponse(null, { status: 404 });
  }

  const [{ data: client }, { data: restaurant }] = await Promise.all([
    supabaseAdmin
      .from("clients")
      .select("last_visit_at, stamps_updated_at")
      .eq("id", ids.clientId)
      .single(),
    supabaseAdmin.from("restaurants").select("updated_at").eq("id", ids.restaurantId).single(),
  ]);

  if (!client || !restaurant) {
    return new NextResponse(null, { status: 404 });
  }

  // Floored to whole seconds: HTTP's Last-Modified/If-Modified-Since have
  // only second-level precision (toUTCString() below truncates to that),
  // but restaurant.updated_at/client.last_visit_at carry millisecond
  // precision from Postgres. Without flooring both sides to the same
  // precision, the value we send now almost never exactly matches the
  // fresh millisecond-precision value we'd recompute on the device's next
  // check -- so the "<= sinceMs" comparison below fails on essentially
  // every request, and the device gets told "changed" (and re-sent the
  // full pass) even when nothing actually changed.
  //
  // stamps_updated_at (see migration 020) covers stamp changes that aren't
  // a real visit -- manual add/retrait from the client fiche, or a
  // gestion-libre scan -- which never touch last_visit_at on purpose (see
  // stamp-actions.ts). Purely additive: every path that already updates
  // last_visit_at (recordVisit) is unaffected.
  const lastModifiedMs =
    Math.floor(
      Math.max(
        Date.parse(restaurant.updated_at ?? "") || 0,
        Date.parse(client.last_visit_at ?? "") || 0,
        Date.parse(client.stamps_updated_at ?? "") || 0
      ) / 1000
    ) * 1000;

  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) {
    const sinceMs = Date.parse(ifModifiedSince);
    if (!Number.isNaN(sinceMs) && lastModifiedMs <= sinceMs) {
      return new NextResponse(null, { status: 304 });
    }
  }

  const result = await buildAppleWalletPassForClient(ids.clientId);
  if ("error" in result) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.pass), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Last-Modified": new Date(lastModifiedMs || Date.now()).toUTCString(),
    },
  });
}
