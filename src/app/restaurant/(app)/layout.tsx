import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { pickForegroundColor } from "@/lib/color-contrast";
import { RestaurantSidebar } from "@/components/restaurant/RestaurantSidebar";
import { RestaurantBottomNav } from "@/components/restaurant/RestaurantBottomNav";

// Route group (app) covers every authenticated /restaurant/** page --
// /restaurant/login and the PWA-only routes (pwa-icon, icon.png) live
// outside it, so this is the one safe place to own the auth redirect
// (the parent restaurant/layout.tsx wraps login too, so it can't).
export default async function RestaurantAppLayout({ children }: { children: React.ReactNode }) {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const themeStyle = {
    "--theme-accent": restaurant.interface_theme_color,
    "--theme-accent-fg": pickForegroundColor(restaurant.interface_theme_color),
    "--theme-text": restaurant.interface_text_color,
    "--theme-card": restaurant.interface_card_color,
    "--theme-card-fg": pickForegroundColor(restaurant.interface_card_color),
  } as React.CSSProperties;

  return (
    <div style={themeStyle} className="flex min-h-screen w-full text-[var(--theme-text)]">
      <RestaurantSidebar restaurantName={restaurant.name} logoUrl={restaurant.logo_url} />
      <main className="min-h-screen flex-1 overflow-x-hidden pb-20 md:pb-0">{children}</main>
      <RestaurantBottomNav />
    </div>
  );
}
