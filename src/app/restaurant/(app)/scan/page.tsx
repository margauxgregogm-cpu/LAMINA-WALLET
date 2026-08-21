import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { ScanClient } from "./ScanClient";

export default async function ScanPage() {
  const restaurant = await getAuthenticatedRestaurant();

  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
      <h1 className="w-full max-w-sm text-xl font-bold tracking-tight">Scanner</h1>
      <ScanClient
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        backgroundColor={restaurant.background_color}
        backgroundImageUrl={restaurant.background_image_url}
        walletTextColor={restaurant.wallet_text_color}
        stampDisplayStyle={restaurant.stamp_display_style}
        stampColor={restaurant.stamp_color}
        stampImageUrl={restaurant.stamp_image_url}
        freeStampManagement={restaurant.free_stamp_management}
      />
    </div>
  );
}
