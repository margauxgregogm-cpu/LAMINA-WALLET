"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

// Refreshes the admin restaurant list when another admin (a second
// concurrent session) creates or edits a restaurant, so both stay in sync
// without a manual reload. See migration 008 for the matching RLS policy —
// only covers the `restaurants` table for now, not per-restaurant client
// counts.
export function LiveAdminUpdates() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient("admin");
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel("admin-restaurants")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "restaurants" },
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
  }, [router]);

  return null;
}
