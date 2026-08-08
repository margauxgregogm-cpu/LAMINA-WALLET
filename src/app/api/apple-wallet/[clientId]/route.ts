import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildAppleWalletPass, isAppleWalletConfigured } from "@/lib/apple-wallet";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  if (!isAppleWalletConfigured()) {
    return NextResponse.json({ error: "Apple Wallet not configured" }, { status: 404 });
  }

  const { clientId } = await params;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, stamps, restaurant_id")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("name, background_color, background_image_url, stamps_required, reward_text, logo_url")
    .eq("id", client.restaurant_id)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const passBuffer = await buildAppleWalletPass({
    restaurantId: client.restaurant_id,
    restaurantName: restaurant.name,
    backgroundColor: restaurant.background_color,
    backgroundImageUrl: restaurant.background_image_url,
    stampsRequired: restaurant.stamps_required,
    rewardText: restaurant.reward_text,
    clientId: client.id,
    clientName: client.first_name,
    stamps: client.stamps,
    logoUrl: restaurant.logo_url,
  });

  return new NextResponse(new Uint8Array(passBuffer), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${restaurant.name}.pkpass"`,
    },
  });
}
