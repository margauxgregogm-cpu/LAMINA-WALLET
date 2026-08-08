"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 60_000;

// Polls /api/version and reloads the tab the moment a new deployment goes
// live -- no F5 needed. Safe to do silently because sessions are cookie-
// based and persist across a reload (see the admin/restaurant cookie fix),
// so this never logs anyone out; it just picks up the new build.
export function AutoUpdate() {
  const initialVersion = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const { version } = (await res.json()) as { version: string };

        if (initialVersion.current === null) {
          initialVersion.current = version;
          return;
        }

        if (version !== initialVersion.current) {
          window.location.reload();
        }
      } catch {
        // Network hiccup or offline -- just try again on the next tick.
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") checkVersion();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
