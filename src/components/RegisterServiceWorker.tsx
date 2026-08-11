"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // updateViaCache: "none" stops the browser from answering the sw.js
    // request out of its HTTP cache, which could otherwise keep an installed
    // PWA pinned to an old worker for up to 24h.
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
      // Non-critical — the app still works without it, just not installable everywhere.
    });
  }, []);

  return null;
}
