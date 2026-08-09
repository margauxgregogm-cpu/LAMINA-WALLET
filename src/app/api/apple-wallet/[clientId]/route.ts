import { NextResponse, type NextRequest } from "next/server";
import { buildAppleWalletPassForClient, isAppleWalletConfigured } from "@/lib/apple-wallet";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  if (!isAppleWalletConfigured()) {
    return NextResponse.json({ error: "Apple Wallet not configured" }, { status: 404 });
  }

  const { clientId } = await params;
  const result = await buildAppleWalletPassForClient(clientId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  // No Content-Disposition on purpose: "attachment" makes Safari on iOS
  // save the file to Downloads instead of opening the native "Add to
  // Apple Wallet" preview sheet -- which also means PassKit never gets a
  // chance to register the pass for push updates, since that only happens
  // once the user actually taps Add in that sheet.
  return new NextResponse(new Uint8Array(result.pass), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
    },
  });
}
