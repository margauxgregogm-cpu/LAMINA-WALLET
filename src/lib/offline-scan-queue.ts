"use client";

// Queues a scan locally when the network request to record it fails (wifi
// drop, dead zone, etc.) so staff can keep scanning without waiting, and
// syncs everything once connectivity comes back. Deliberately scoped to
// the camera-scan flow only: this only helps once the scan page is already
// open in the browser -- it can't make the page itself load with zero
// connectivity, since that page is server-rendered and needs a request to
// reach the server at all.
const STORAGE_KEY = "lamina-offline-scan-queue";

export type QueuedScan = {
  id: string;
  clientId: string;
  queuedAt: string;
};

export function getQueue(): QueuedScan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedScan[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedScan[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueScan(clientId: string): QueuedScan {
  const entry: QueuedScan = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    clientId,
    queuedAt: new Date().toISOString(),
  };
  saveQueue([...getQueue(), entry]);
  return entry;
}

export function removeFromQueue(id: string) {
  saveQueue(getQueue().filter((q) => q.id !== id));
}
