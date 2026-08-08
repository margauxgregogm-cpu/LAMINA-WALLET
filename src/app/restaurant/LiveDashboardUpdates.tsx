"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

// Subscribes to new clients signing up for this restaurant and refreshes the
// server-rendered dashboard data so the leaderboard/count update live —
// the restaurant doesn't have to do anything or reload the page.
export function LiveDashboardUpdates({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient("restaurant");
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      // Realtime's RLS check needs the user's JWT — without explicitly
      // handing it the access token, a freshly created browser client can
      // subscribe before its cookie-based session finishes loading, and the
      // channel silently authenticates as anon (no rows visible, no events).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`restaurant-${restaurantId}-clients`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "clients",
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          () => {
            router.refresh();
          }
        )
        .subscribe();
    }

    setup();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [restaurantId, router]);

  return null;
}
