"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

// Applies admin-side changes to this restaurant (interface colours, name,
// logo, reward text, stamps required...) to an already-open entreprise app,
// without the staff having to close and reopen it.
//
// The deployment-version poll in AutoUpdate can't cover this: editing a
// restaurant changes a database row, not the deployed build, so the version
// stays identical and nothing there ever fires. This listens to the row
// itself instead. router.refresh() re-renders the server tree, layout
// included, so the theme variables are recomputed in place -- no full
// reload, nothing lost, nobody signed out.
export function LiveRestaurantSettings({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient("restaurant");
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      // Realtime enforces RLS off the JWT, and a fresh browser client can
      // subscribe before its cookie session has loaded -- without handing it
      // the token explicitly the channel authenticates as anon and silently
      // receives nothing. Same guard as LiveDashboardUpdates.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`restaurant-${restaurantId}-settings`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "restaurants",
            filter: `id=eq.${restaurantId}`,
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
