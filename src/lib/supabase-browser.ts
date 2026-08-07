import { createBrowserClient } from "@supabase/ssr";

// Only used from the restaurant section — must use the same cookie name as
// src/lib/supabase-server.ts's "restaurant" client, otherwise this client
// can't see the session the server set.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { name: "sb-restaurant-auth" } }
  );
}
