import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAuthHeader } from "@/lib/apple-wallet-auth";

type Params = {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
};

// iOS calls this right after the user adds the pass to Wallet, to register
// for push updates.
export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;

  // Diagnostic only, no behavior change: lets us confirm from the logs
  // whether a device ever attempts registration at all for a given pass,
  // and if so, whether it succeeds -- see the matching logs added to the
  // passes/.../route.ts GET handler.
  if (!verifyAuthHeader(request.headers.get("authorization"), serialNumber)) {
    console.log(`Apple Wallet registration: serial=${serialNumber} device=${deviceLibraryIdentifier} -> 401 (bad auth token)`);
    return new NextResponse(null, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { pushToken?: string } | null;
  if (!body?.pushToken) {
    console.log(`Apple Wallet registration: serial=${serialNumber} device=${deviceLibraryIdentifier} -> 400 (missing pushToken)`);
    return new NextResponse(null, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("apple_wallet_registrations").upsert(
    {
      device_library_identifier: deviceLibraryIdentifier,
      pass_type_identifier: passTypeIdentifier,
      serial_number: serialNumber,
      push_token: body.pushToken,
    },
    { onConflict: "device_library_identifier,pass_type_identifier,serial_number" }
  );

  if (error) {
    console.error("Apple Wallet registration error:", error);
    return new NextResponse(null, { status: 500 });
  }

  console.log(`Apple Wallet registration: serial=${serialNumber} device=${deviceLibraryIdentifier} -> 201 (registered)`);
  return new NextResponse(null, { status: 201 });
}

// iOS calls this when the user removes the pass from Wallet.
export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;

  if (!verifyAuthHeader(request.headers.get("authorization"), serialNumber)) {
    return new NextResponse(null, { status: 401 });
  }

  await supabaseAdmin
    .from("apple_wallet_registrations")
    .delete()
    .eq("device_library_identifier", deviceLibraryIdentifier)
    .eq("pass_type_identifier", passTypeIdentifier)
    .eq("serial_number", serialNumber);

  console.log(`Apple Wallet registration: serial=${serialNumber} device=${deviceLibraryIdentifier} -> deregistered (removed from Wallet)`);
  return new NextResponse(null, { status: 200 });
}
