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

// Apple explicitly warns against opening a fresh connection per push
// ("repeatedly opening and closing connections to APNs" can get a provider
// throttled/deprioritized -- https://developer.apple.com/documentation/usernotifications/setting-up-a-remote-notification-server,
// "Establish a persistent connection"). The previous version of this file
// called http2.connect() and client.close() on every single sendPush(),
// including once per registered device inside the same Promise.all -- i.e.
// N brand-new connections for N devices on every save, and another N next
// time. That matches this project's own symptom report almost exactly:
// pushes appearing to queue up and only deliver in a burst once something
// else (a new client's own pass creation) touched Apple's servers again.
//
// One HTTP/2 session is now opened lazily and reused across every push in
// this process (HTTP/2 multiplexes many concurrent streams over a single
// connection natively, which is exactly what Apple recommends instead).
// It's only replaced if it errors or the remote end closes it.
let cachedSession: http2.ClientHttp2Session | null = null;

function getApnsSession(): http2.ClientHttp2Session {
  if (cachedSession && !cachedSession.closed && !cachedSession.destroyed) {
    return cachedSession;
  }
  const session = http2.connect("https://api.push.apple.com:443");
  session.on("error", () => {
    if (cachedSession === session) cachedSession = null;
  });
  session.on("close", () => {
    if (cachedSession === session) cachedSession = null;
  });
  // Serverless functions get frozen between invocations -- an open socket
  // must not keep the process alive waiting for more work that never comes.
  session.unref();
  cachedSession = session;
  return session;
}

const REQUEST_TIMEOUT_MS = 10_000;

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
//
// Also now has an explicit timeout: without one, a stream that never emits
// "response"/"end"/"error" (Apple hangs, or a network middlebox drops the
// packet silently) left this Promise permanently unresolved -- meaning the
// Promise.all in pushToRegistrations, and the after() callback awaiting it,
// could hang indefinitely and never reach the summary log below, an
// on-server failure mode indistinguishable from "nothing happened" from
// the outside, exactly like the reported symptom.
function sendPush(pushToken: string, passTypeIdentifier: string): Promise<PushResult> {
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

    const session = getApnsSession();
    const req = session.request({
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
      if (status === 200) finish({ outcome: "ok", status });
      else if (status === 410 || status === 400) finish({ outcome: "gone", status, detail: body });
      else finish({ outcome: "error", status, detail: body });
    });
    req.on("error", (err) => {
      finish({ outcome: "error", status: 0, detail: String(err) });
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
