import "server-only";
import http2 from "http2";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "./supabase-admin";
import { isAppleWalletConfigured } from "./apple-wallet";

export function isApplePushConfigured() {
  return Boolean(
    isAppleWalletConfigured() &&
      process.env.APPLE_WALLET_APNS_KEY_ID &&
      process.env.APPLE_WALLET_APNS_KEY
  );
}

// APNs wants provider tokens reused for a while, not regenerated per
// request -- a fresh one per push would work too, but this is what Apple
// recommends and it's nearly free to do.
let cachedToken: { token: string; issuedAt: number } | null = null;
const TOKEN_MAX_AGE_MS = 50 * 60 * 1000;

function getApnsProviderToken(): string {
  if (cachedToken && Date.now() - cachedToken.issuedAt < TOKEN_MAX_AGE_MS) {
    return cachedToken.token;
  }
  const token = jwt.sign(
    { iss: process.env.APPLE_WALLET_TEAM_IDENTIFIER, iat: Math.floor(Date.now() / 1000) },
    process.env.APPLE_WALLET_APNS_KEY!.replace(/\\n/g, "\n"),
    { algorithm: "ES256", header: { alg: "ES256", kid: process.env.APPLE_WALLET_APNS_KEY_ID! } }
  );
  cachedToken = { token, issuedAt: Date.now() };
  return token;
}

type PushResult = { outcome: "ok" | "gone" | "error"; status: number; detail?: string };

// Sends a silent "your pass changed" push. Returns "gone" if Apple says the
// token is no longer valid (user removed the pass, reinstalled the OS,
// etc.) so the caller can drop the stale registration.
//
// Every outcome now carries the raw HTTP status (and, on failure, whatever
// body Apple sent back -- APNs errors are a JSON {"reason": "..."}) so
// pushToRegistrations can actually log *why* a push failed instead of a
// silent no-op indistinguishable from success. Previously the "error" case
// (anything that isn't 200/410/400) was swallowed with zero logging, so an
// intermittent APNs rejection (bad/expired provider token, rate limiting,
// network blip) looked identical to "nothing went wrong" from the outside.
function sendPush(pushToken: string, passTypeIdentifier: string): Promise<PushResult> {
  return new Promise((resolve) => {
    const client = http2.connect("https://api.push.apple.com:443");
    client.on("error", (err) => resolve({ outcome: "error", status: 0, detail: String(err) }));

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${pushToken}`,
      authorization: `bearer ${getApnsProviderToken()}`,
      "apns-topic": passTypeIdentifier,
      "apns-push-type": "background",
      "apns-priority": "5",
      "content-type": "application/json",
    });

    let status = 0;
    let body = "";
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      client.close();
      if (status === 200) resolve({ outcome: "ok", status });
      else if (status === 410 || status === 400) resolve({ outcome: "gone", status, detail: body });
      else resolve({ outcome: "error", status, detail: body });
    });
    req.on("error", (err) => {
      client.close();
      resolve({ outcome: "error", status: 0, detail: String(err) });
    });

    req.end(JSON.stringify({}));
  });
}

async function pushToRegistrations(serialNumberFilter: { column: "serial_number" | "restaurant_prefix"; value: string }) {
  if (!isApplePushConfigured()) {
    console.warn("Apple Wallet push skipped: not configured (missing APNs env vars).");
    return;
  }

  const passTypeIdentifier = process.env.APPLE_WALLET_PASS_TYPE_IDENTIFIER!;
  let query = supabaseAdmin
    .from("apple_wallet_registrations")
    .select("id, push_token")
    .eq("pass_type_identifier", passTypeIdentifier);

  query =
    serialNumberFilter.column === "serial_number"
      ? query.eq("serial_number", serialNumberFilter.value)
      : query.like("serial_number", `${serialNumberFilter.value}-%`);

  const { data: registrations } = await query;
  if (!registrations || registrations.length === 0) {
    console.log(
      `Apple Wallet push: no registered devices for ${serialNumberFilter.column}=${serialNumberFilter.value} -- nothing to notify.`
    );
    return;
  }

  const staleIds: string[] = [];
  const results = await Promise.all(
    registrations.map(async (r) => {
      const result = await sendPush(r.push_token, passTypeIdentifier);
      if (result.outcome === "gone") staleIds.push(r.id);
      return result;
    })
  );

  const okCount = results.filter((r) => r.outcome === "ok").length;
  const goneCount = results.filter((r) => r.outcome === "gone").length;
  const errorResults = results.filter((r) => r.outcome === "error");
  console.log(
    `Apple Wallet push to ${registrations.length} device(s) for ${serialNumberFilter.column}=${serialNumberFilter.value}: ${okCount} ok, ${goneCount} gone (deregistered), ${errorResults.length} error.`
  );
  for (const r of errorResults) {
    console.error(`Apple Wallet push failed: status=${r.status} detail=${r.detail ?? "(none)"}`);
  }

  if (staleIds.length > 0) {
    await supabaseAdmin.from("apple_wallet_registrations").delete().in("id", staleIds);
  }
}

// Call after recording a visit -- pushes just that one client's pass.
export async function notifyApplePassUpdate({
  restaurantId,
  clientId,
}: {
  restaurantId: string;
  clientId: string;
}) {
  try {
    await pushToRegistrations({ column: "serial_number", value: `${restaurantId}-${clientId}` });
  } catch (err) {
    console.error("Apple Wallet push error:", err);
  }
}

// Call after a restaurant design change (background, reward text, stamps
// required, logo) -- pushes every client of that restaurant at once.
export async function notifyApplePassUpdatesForRestaurant(restaurantId: string) {
  try {
    await pushToRegistrations({ column: "restaurant_prefix", value: restaurantId });
  } catch (err) {
    console.error("Apple Wallet push error:", err);
  }
}
