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

// Sends a silent "your pass changed" push. Returns "gone" if Apple says the
// token is no longer valid (user removed the pass, reinstalled the OS,
// etc.) so the caller can drop the stale registration.
function sendPush(pushToken: string, passTypeIdentifier: string): Promise<"ok" | "gone" | "error"> {
  return new Promise((resolve) => {
    const client = http2.connect("https://api.push.apple.com:443");
    client.on("error", () => resolve("error"));

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
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("end", () => {
      client.close();
      if (status === 200) resolve("ok");
      else if (status === 410 || status === 400) resolve("gone");
      else resolve("error");
    });
    req.on("error", () => {
      client.close();
      resolve("error");
    });

    req.end(JSON.stringify({}));
  });
}

async function pushToRegistrations(serialNumberFilter: { column: "serial_number" | "restaurant_prefix"; value: string }) {
  if (!isApplePushConfigured()) return;

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
  if (!registrations || registrations.length === 0) return;

  const staleIds: string[] = [];
  await Promise.all(
    registrations.map(async (r) => {
      const result = await sendPush(r.push_token, passTypeIdentifier);
      if (result === "gone") staleIds.push(r.id);
    })
  );

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
