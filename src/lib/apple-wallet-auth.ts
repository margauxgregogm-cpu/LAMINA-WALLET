import "server-only";
import crypto from "crypto";

// Per-pass token Apple echoes back as "Authorization: ApplePass <token>" on
// every PassKit web-service call for that pass. Deriving it with HMAC means
// there's nothing to store or look up -- any request can be verified just
// from the serialNumber already in its URL.
export function authTokenFor(serialNumber: string): string {
  return crypto
    .createHmac("sha256", process.env.APPLE_WALLET_AUTH_SECRET!)
    .update(serialNumber)
    .digest("hex");
}

export function verifyAuthHeader(authHeader: string | null, serialNumber: string): boolean {
  if (!authHeader?.startsWith("ApplePass ")) return false;
  const token = authHeader.slice("ApplePass ".length);
  const expected = authTokenFor(serialNumber);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

// serialNumber is `${restaurantId}-${clientId}`, both plain UUIDs (36
// chars). Splitting naively on "-" breaks because UUIDs contain dashes
// themselves -- slicing at the fixed UUID length is the reliable way back.
export function parseSerialNumber(serialNumber: string): { restaurantId: string; clientId: string } | null {
  if (serialNumber.length !== 73 || serialNumber[36] !== "-") return null;
  return { restaurantId: serialNumber.slice(0, 36), clientId: serialNumber.slice(37) };
}
