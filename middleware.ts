import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Admin and restaurant are different Supabase Auth users signed in from
  // the same browser/origin — each section's server/browser clients use a
  // distinct cookie name (see src/lib/supabase-server.ts) so signing into
  // one doesn't sign the other out. Refresh whichever cookie matches the
  // section this request belongs to.
  const section = request.nextUrl.pathname.startsWith("/admin") ? "admin" : "restaurant";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: `sb-${section}-auth` },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the auth token cookie if needed so Server Components see a valid session.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/restaurant/:path*", "/admin/:path*"],
};
