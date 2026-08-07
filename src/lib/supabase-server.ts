import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Admin and restaurant are different Supabase Auth users signed in from the
// same browser/origin. A single shared session cookie can only hold one of
// them at a time, so signing into one silently signs the other out. Giving
// each section its own cookie name keeps the two sessions independent.
export async function createClient(section: "admin" | "restaurant") {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: `sb-${section}-auth` },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component during render — the session is
            // still refreshed by middleware, so this can be safely ignored.
          }
        },
      },
    }
  );
}
