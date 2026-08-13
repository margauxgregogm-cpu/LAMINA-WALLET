import { SplashScreen } from "@/components/restaurant/SplashScreen";

// Next.js Suspense fallback for everything under /restaurant/** (login and
// the authenticated app). Only /restaurant/(app)/layout.tsx does uncached,
// blocking work (the Supabase auth + restaurant lookup in
// getAuthenticatedRestaurant), and only on a boundary's first mount --
// client-side navigation between already-loaded tabs reuses the cached
// layout and never re-triggers this fallback.
export default function RestaurantLoading() {
  return <SplashScreen />;
}
