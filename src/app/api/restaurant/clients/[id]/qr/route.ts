import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Strips accents/spaces/anything not filesystem-safe so the download always
// lands with a valid filename, regardless of what's in first_name/last_name.
function sanitizeFilenamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

// Serves the exact same value encoded in the Apple/Google Wallet barcode and
// in the QR shown at signup (see apple-wallet.ts / google-wallet.ts / the
// signup/success page) -- the client's raw id, nothing else. This is a
// read-only render of that existing QR: it never mutates stamps, visits, or
// the client's scan credentials.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, last_name")
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // 800px + a 2-module quiet zone keeps the code scannable at print size --
  // well above what the inline preview needs, deliberately generated fresh
  // here rather than reused from a smaller on-screen version.
  const buffer = await QRCode.toBuffer(client.id, {
    width: 800,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  const namePart = sanitizeFilenamePart(`${client.first_name ?? ""}-${client.last_name ?? ""}`);
  const filename = namePart ? `qr-${namePart}.png` : `qr-client-${client.id.slice(0, 8)}.png`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
