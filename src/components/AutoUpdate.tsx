"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 30_000;

// Polls /api/version and reloads the tab the moment a new deployment goes
// live -- no F5 needed. Safe to do silently because sessions are cookie-
// based and persist across a reload (see the admin/restaurant cookie fix),
// so this never logs anyone out; it just picks up the new build.
//
// Installed PWAs freeze timers while backgrounded, so an interval alone
// meant the app effectively only noticed a new build when it was closed and
// reopened. Every event that can mean "the app just woke up or regained
// connectivity" now triggers a check too, and the request carries a
// cache-busting param because some PWA/webview contexts still serve a
// cached response despite `cache: "no-store"`.
export function AutoUpdate() {
  const initialVersion = useRef<string | null>(null);
  const reloadingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      if (cancelled || reloadingRef.current) return;
      try {
        const res = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const { version } = (await res.json()) as { version: string };
        if (!version) return;

        if (initialVersion.current === null) {
          initialVersion.current = version;
          return;
        }

        if (version !== initialVersion.current) {
          reloadingRef.current = true;
          // Drop the old service worker registration's cached script too, so
          // the reload starts from the new deployment in every layer.
          try {
            const reg = await navigator.serviceWorker?.getRegistration();
            await reg?.update();
          } catch {
            // Service worker unavailable (unsupported, or blocked) -- the
            // reload below is what actually matters.
          }
          window.location.reload();
        }
      } catch {
        // Network hiccup or offline -- just try again on the next tick.
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);

    function onWake() {
      if (document.visibilityState === "visible") checkVersion();
    }

    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    // Restoring from the back/forward cache doesn't always fire
    // visibilitychange, so cover it explicitly.
    window.addEventListener("pageshow", onWake);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
      window.removeEventListener("pageshow", onWake);
    };
  }, []);

  return null;
}
