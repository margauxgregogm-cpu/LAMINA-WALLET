"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/restaurant/SplashScreen";

// PWA start_url (see public/restaurant-manifest.webmanifest) and the
// general "the app is opening" entry point. Renders nothing but the splash
// -- no auth check, no data fetch -- so the very first bytes the browser
// paints never depend on Supabase or on how the real destination's response
// happens to be delivered.
//
// /restaurant/(app)/** pages stream their content behind a Suspense
// boundary (src/app/restaurant/loading.tsx) so the splash would show there
// too in principle, but in production Vercel compresses the response,
// which buffers the whole stream into a single chunk and defeats that --
// confirmed by fetching the deployed preview directly and comparing
// Accept-Encoding: identity (multiple chunks, streamed) against the
// default (one chunk, arrives all at once). That single buffered response
// still takes the real auth-check time to arrive, so without this page the
// user was staring at a blank tab for that whole window instead of the
// splash.
//
// This page sidesteps the problem entirely: it has nothing to stream in
// the first place, so it paints immediately regardless of compression, and
// the handoff to the real, data-backed route happens via a client-side
// navigation (not a fresh document load) once mounted -- Next.js keeps
// this splash on screen while that route's data loads in the background,
// per the same "keep old content until the transition resolves" behavior
// client-side tab navigation already relies on elsewhere in the app.
export default function RestaurantLaunchPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/restaurant/scan");
  }, [router]);

  return <SplashScreen />;
}
