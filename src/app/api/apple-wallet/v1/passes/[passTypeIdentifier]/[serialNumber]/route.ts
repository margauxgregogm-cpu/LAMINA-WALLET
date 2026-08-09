import { NextResponse, type NextRequest } from "next/server";
import { buildAppleWalletPassForClient } from "@/lib/apple-wallet";
import { verifyAuthHeader, parseSerialNumber } from "@/lib/apple-wallet-auth";

type Params = { passTypeIdentifier: string; serialNumber: string };

// iOS calls this to fetch the latest version of a pass it already has,
// either after a push notification or on its own periodic schedule.
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { serialNumber } = await params;

  if (!verifyAuthHeader(request.headers.get("authorization"), serialNumber)) {
    return new NextResponse(null, { status: 401 });
  }

  const ids = parseSerialNumber(serialNumber);
  if (!ids) {
    return new NextResponse(null, { status: 404 });
  }

  const result = await buildAppleWalletPassForClient(ids.clientId);
  if ("error" in result) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.pass), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Last-Modified": new Date().toUTCString(),
    },
  });
}
