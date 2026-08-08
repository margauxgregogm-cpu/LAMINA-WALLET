import { createBrowserClient } from "@supabase/ssr";

// Must use the same cookie name as the matching section's server client
// (src/lib/supabase-server.ts), otherwise this client can't see the session
// the server set.
export function createClient(section: "admin" | "restaurant") {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { name: `sb-${section}-auth` } }
  );
}
