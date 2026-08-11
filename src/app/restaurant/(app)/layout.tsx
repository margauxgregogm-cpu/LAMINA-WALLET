import type { Viewport } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { pickForegroundColor, tint, shade, isLightColor } from "@/lib/color-contrast";
import { RestaurantSidebar } from "@/components/restaurant/RestaurantSidebar";
import { RestaurantHeader } from "@/components/restaurant/RestaurantHeader";
import { RestaurantBottomNav } from "@/components/restaurant/RestaurantBottomNav";
import { LiveRestaurantSettings } from "@/components/restaurant/LiveRestaurantSettings";

// Overrides the parent layout's static green themeColor so the installed
// PWA's title bar (and the mobile browser chrome) takes each restaurant's
// own interface colour instead of a fixed green band that clashes with the
// themed header right below it.
export async function generateViewport(): Promise<Viewport> {
  const restaurant = await getAuthenticatedRestaurant();
  return { themeColor: restaurant?.interface_theme_color ?? "#ffffff" };
}

// Route group (app) covers every authenticated /restaurant/** page --
// /restaurant/login and the PWA-only routes (pwa-icon, icon.png) live
// outside it, so this is the one safe place to own the auth redirect
// (the parent restaurant/layout.tsx wraps login too, so it can't).
export default async function RestaurantAppLayout({ children }: { children: React.ReactNode }) {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const accent = restaurant.interface_theme_color;
  const card = restaurant.interface_card_color;

  // The whole interface palette is derived from the single accent the admin
  // picks: the header uses it at full strength, and progressively lighter
  // tints give the sidebar, page background and icon pills their tone. A
  // very light accent (e.g. white/yellow) would produce an invisible header,
  // so in that case the header falls back to a darkened version instead.
  const accentIsLight = isLightColor(accent);
  const headerBg = accent;
  const themeStyle = {
    "--theme-accent": accent,
    "--theme-accent-fg": pickForegroundColor(accent),
    "--theme-accent-strong": accentIsLight ? shade(accent, 0.25) : accent,
    "--theme-accent-soft": tint(accent, 0.82),
    "--theme-header-bg": headerBg,
    "--theme-header-fg": pickForegroundColor(headerBg),
    "--theme-sidebar-bg": tint(accent, 0.9),
    "--theme-page-bg": tint(accent, 0.95),
    "--theme-text": restaurant.interface_text_color,
    "--theme-card": card,
    "--theme-card-fg": pickForegroundColor(card),
  } as React.CSSProperties;

  return (
    <div style={themeStyle} className="flex min-h-screen w-full text-[var(--theme-text)]">
      <LiveRestaurantSettings restaurantId={restaurant.id} />
      <RestaurantSidebar restaurantName={restaurant.name} logoUrl={restaurant.logo_url} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <RestaurantHeader restaurantName={restaurant.name} logoUrl={restaurant.logo_url} />
        <main className="flex-1 overflow-x-hidden bg-[var(--theme-page-bg)] pb-24 md:pb-0">
          {children}
        </main>
      </div>
      <RestaurantBottomNav />
    </div>
  );
}
