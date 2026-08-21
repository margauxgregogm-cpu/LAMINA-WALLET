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
// recommends and it's nearly free to do. Unlike the HTTP/2 session below,
// this is inert data (a signed JWT string), not a live connection, so
// caching it across invocations carries none of the staleness risk a
// cached socket does -- worst case it's regenerated a bit early.
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

const REQUEST_TIMEOUT_MS = 10_000;

// Sends a silent "your pass changed" push over an already-open session.
// Returns "gone" if Apple says the token is no longer valid (user removed
// the pass, reinstalled the OS, etc.) so the caller can drop the stale
// registration.
function sendPush(
  session: http2.ClientHttp2Session,
  pushToken: string,
  passTypeIdentifier: string
): Promise<PushResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: PushResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      req.close();
      finish({ outcome: "error", status: 0, detail: "timed out waiting for APNs response" });
    }, REQUEST_TIMEOUT_MS);

    const req = session.request({
      ":method": "POST",
      ":path": `/3/device/${pushToken}`,
      authorization: `bearer ${getApnsProviderToken()}`,
      "apns-topic": passTypeIdentifier,
      "apns-push-type": "background",
      "apns-priority": "5",
      // Without this, Apple treats the notification as if it were 0 (its
      // own default): "not stored, only delivered if the device is
      // currently connected". If the phone isn't reachable at that exact
      // instant (locked screen, poor signal, Low Power Mode), APNs silently
      // drops it -- and still answers 200, since the request itself was
      // valid, so the drop is invisible to us. A day-long window instead
      // makes APNs actually queue and retry delivery.
      "apns-expiration": String(Math.floor(Date.now() / 1000) + 86400),
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
      if (status === 200) {
        finish({ outcome: "ok", status });
        return;
      }
      // Apple's APNs error body is {"reason": "..."}. 410 always means the
      // token is truly dead ("Unregistered") -- safe to delete. 400 covers
      // many unrelated reasons too (BadTopic, BadExpirationDate, IdleTimeout,
      // PayloadEmpty, DuplicateHeaders...), most of which are transient or
      // request-shape issues that say nothing about the token's validity.
      // Only "BadDeviceToken" (the 400-status equivalent of a dead token)
      // is treated as gone -- everything else is logged as an error but the
      // registration is kept and retried on the next change.
      let reason: string | undefined;
      try {
        reason = (JSON.parse(body) as { reason?: string }).reason;
      } catch {
        reason = undefined;
      }
      const isGone = status === 410 || (status === 400 && reason === "BadDeviceToken");
      finish({ outcome: isGone ? "gone" : "error", status, detail: body });
    });
    req.on("error", (err) => {
      finish({ outcome: "error", status: 0, detail: String(err) });
    });

    req.end(JSON.stringify({}));
  });
}

const SESSION_CONNECT_TIMEOUT_MS = 10_000;

// Opens a fresh HTTP/2 session for this one push event only -- deliberately
// NOT cached across invocations. An earlier version of this file reused one
// module-level session across every save, on the (correct, Apple-documented)
// principle that opening a new connection per push token is wasteful. But
// caching it *across separate admin saves*, in a serverless environment
// where Vercel freezes and later thaws an instance between invocations, has
// a real failure mode this project's own comments already flagged: a thawed
// session's underlying socket can have died while frozen (NAT/load-balancer
// idle timeout) without Node ever getting the chance to fire "close"/
// "error" -- so the next push on that stale session can silently hang or
// fail, indistinguishable from "nothing happened" until this event's own
// REQUEST_TIMEOUT_MS finally kicks in. That matches exactly the symptom of
// some saves delivering and others silently not.
//
// This still satisfies Apple's actual requirement (never open a separate
// connection *per device* within one push event -- see the batch loop
// below, which reuses this one session for every registration in the
// event) while removing any possibility of a stale, cross-invocation
// connection ever being reused. The cost is one fresh TLS+HTTP/2 handshake
// per admin save/notification, which is negligible next to a push actually
// failing to deliver.
async function withApnsSession<T>(fn: (session: http2.ClientHttp2Session) => Promise<T>): Promise<T> {
  const session = http2.connect("https://api.push.apple.com:443");
  session.unref();
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timed out connecting to APNs"));
      }, SESSION_CONNECT_TIMEOUT_MS);
      session.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
      session.once("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
    return await fn(session);
  } finally {
    session.close();
  }
}

async function pushToRegistrations(serialNumberFilter: { column: "serial_number" | "restaurant_prefix"; value: string }) {
  if (!isApplePushConfigured()) {
    console.warn("Apple Wallet push skipped: not configured (missing APNs env vars).");
    return;
  }

  const passTypeIdentifier = process.env.APPLE_WALLET_PASS_TYPE_IDENTIFIER!;
  let query = supabaseAdmin
    .from("apple_wallet_registrations")
    .select("id, push_token, serial_number")
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

  let results: PushResult[] = [];
  const staleIds: string[] = [];

  try {
    await withApnsSession(async (session) => {
      // Sent in batches rather than one giant Promise.all: a single
      // restaurant with a very large client base would otherwise open a
      // burst of concurrent HTTP/2 streams equal to its whole device count
      // in one go. The session is still reused for every stream in every
      // batch -- this only bounds how many streams are open on it at once.
      // 100 is a conservative concurrency figure for one HTTP/2 connection
      // (well under typical server-side SETTINGS_MAX_CONCURRENT_STREAMS
      // values) that still keeps small/medium restaurants (the common case
      // today) at a single batch, so nothing gets slower for them.
      const PUSH_BATCH_SIZE = 100;
      for (let i = 0; i < registrations.length; i += PUSH_BATCH_SIZE) {
        const batch = registrations.slice(i, i + PUSH_BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (r) => {
            const result = await sendPush(session, r.push_token, passTypeIdentifier);
            if (result.outcome === "gone") {
              staleIds.push(r.id);
              // Deletion is a one-way door for this registration -- always
              // logged individually (not just the aggregate count below) so
              // a wrongly-deregistered card can be traced back to the exact
              // APNs response that caused it.
              console.log(
                `Apple Wallet registration deregistered: serial=${r.serial_number} status=${result.status} detail=${result.detail ?? "(none)"}`
              );
            }
            return result;
          })
        );
        results.push(...batchResults);
      }
    });
  } catch (err) {
    // Session-level failure (couldn't connect at all) -- every registration
    // in this event counts as an error, none are deleted (a connection
    // failure says nothing about token validity).
    console.error("Apple Wallet APNs session error:", err);
    results = registrations.map(() => ({ outcome: "error" as const, status: 0, detail: String(err) }));
  }

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
// required, logo, stamp style/color/image) -- pushes every client of that
// restaurant at once.
export async function notifyApplePassUpdatesForRestaurant(restaurantId: string) {
  try {
    await pushToRegistrations({ column: "restaurant_prefix", value: restaurantId });
  } catch (err) {
    console.error("Apple Wallet push error:", err);
  }
}
