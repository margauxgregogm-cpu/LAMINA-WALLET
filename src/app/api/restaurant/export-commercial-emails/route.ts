import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function csvField(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Export scope is intentionally minimal: current opt-in status + an email
// address, per restaurant. No deliverability checks, no cross-restaurant
// data -- restaurant_id comes only from the authenticated session, never
// from the request.
export async function GET() {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const { data: clients } = await supabaseAdmin
    .from("clients")
    .select("email, first_name, last_name")
    .eq("restaurant_id", restaurant.id)
    .eq("commercial_email_consent", true);

  // email is a not-null column, but stay defensive: never emit a blank
  // line or a fabricated address for a row that somehow has none.
  const rows = (clients ?? []).filter((c) => c.email && c.email.trim().length > 0);

  if (rows.length === 0) {
    redirect("/restaurant?exportEmpty=1");
  }

  const lines = [
    "Email,Prénom,Nom",
    ...rows.map((c) =>
      [csvField(c.email), csvField(c.first_name ?? ""), csvField(c.last_name ?? "")].join(",")
    ),
  ];
  const csv = "﻿" + lines.join("\r\n") + "\r\n";

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="emails-commerciaux-${restaurant.slug}-${date}.csv"`,
    },
  });
}
