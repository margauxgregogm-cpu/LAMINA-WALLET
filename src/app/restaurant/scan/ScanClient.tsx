"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { QrScanner } from "@/components/QrScanner";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { recordVisit } from "./actions";
import { searchClients } from "../actions";

type Client = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  city: string | null;
  stamps: number;
  total_visits: number;
  is_vip: boolean;
  last_visit_at: string | null;
};

type VisitResult = {
  alreadyVisitedToday: boolean;
  clientId: string;
  clientName: string;
  clientFullName: string;
  stamps: number;
  stampsRequired: number;
  rewardEarned?: boolean;
  rewardText: string;
};

export function ScanClient({
  restaurantName,
  logoUrl,
  backgroundColor,
  backgroundImageUrl,
}: {
  restaurantName: string;
  logoUrl: string | null;
  backgroundColor: string;
  backgroundImageUrl: string | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [searched, setSearched] = useState(false);
  const [addingVisitId, setAddingVisitId] = useState<string | null>(null);
  const [overlayResult, setOverlayResult] = useState<VisitResult | null>(null);
  const [lastClient, setLastClient] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // The camera keeps decoding while the client's QR code is still in frame,
  // so dismissing the result overlay (which resumes the scanner) can
  // immediately re-trigger a scan of the exact same code, popping the
  // overlay right back up. Ignore repeat scans of the same code for a short
  // window so it takes an actual new code to trigger another visit.
  const lastScanRef = useRef<{ id: string; at: number } | null>(null);
  const SCAN_COOLDOWN_MS = 10_000;

  const OVERLAY_AUTO_DISMISS_MS = 5_000;

  function showVisitResult(result: VisitResult) {
    setOverlayResult(result);
    setLastClient({ id: result.clientId, name: result.clientFullName });
  }

  // Auto-dismiss the result overlay if nobody taps to close it, so the next
  // scan doesn't require an extra click.
  useEffect(() => {
    if (!overlayResult) return;
    const timeout = setTimeout(() => setOverlayResult(null), OVERLAY_AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [overlayResult]);

  function runScan(clientId: string) {
    const trimmed = clientId.trim();
    const now = Date.now();
    const last = lastScanRef.current;
    if (last && last.id === trimmed && now - last.at < SCAN_COOLDOWN_MS) {
      return;
    }
    lastScanRef.current = { id: trimmed, at: now };

    setError(null);
    setResults([]);
    setSearched(false);
    startTransition(async () => {
      const result = await recordVisit(trimmed);
      if ("error" in result) {
        setError(result.error ?? "Erreur inconnue");
        return;
      }
      showVisitResult(result);
    });
  }

  function runSearch(q: string) {
    setError(null);
    startTransition(async () => {
      const data = await searchClients(q.trim());
      setResults(data);
      setSearched(true);
    });
  }

  async function handleAddVisit(client: Client) {
    setAddingVisitId(client.id);
    setError(null);
    const result = await recordVisit(client.id);
    setAddingVisitId(null);
    if ("error" in result) {
      setError(result.error ?? "Erreur inconnue");
      return;
    }
    setResults([]);
    setSearched(false);
    setQuery("");
    showVisitResult(result);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <QrScanner onScan={runScan} paused={!!overlayResult} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un client (nom, email, ville ou ID)"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          Chercher
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {searched && (
        <div className="flex flex-col gap-3">
          {results.length === 0 && <p className="text-sm text-zinc-500">Aucun client trouvé.</p>}
          {results.map((client) => (
            <div
              key={client.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <Link
                  href={`/restaurant/clients/${client.id}`}
                  className="text-lg font-semibold underline-offset-2 hover:underline"
                >
                  {client.first_name} {client.last_name} {client.is_vip && <span title="VIP">⭐</span>}
                </Link>
                <div className="text-sm text-zinc-500">
                  {client.email}
                  {client.city ? ` · ${client.city}` : ""}
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Tampons : {client.stamps} — Visites totales : {client.total_visits}
              </div>
              {client.last_visit_at && (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Dernière visite : {new Date(client.last_visit_at).toLocaleDateString("fr-FR")}
                </div>
              )}
              <button
                onClick={() => handleAddVisit(client)}
                disabled={addingVisitId === client.id}
                className="mt-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {addingVisitId === client.id ? "..." : "Ajouter une visite"}
              </button>
            </div>
          ))}
        </div>
      )}

      {lastClient && !overlayResult && (
        <Link
          href={`/restaurant/clients/${lastClient.id}`}
          className="text-center text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Dernier client scanné : {lastClient.name}
        </Link>
      )}

      {overlayResult && (
        <div
          onClick={() => setOverlayResult(null)}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-6 bg-black/70 px-4 py-8"
        >
          <div onClick={(e) => e.stopPropagation()} className="flex w-full max-w-sm flex-col items-center gap-4">
            {overlayResult.alreadyVisitedToday ? (
              <div className="w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center dark:border-amber-800 dark:bg-amber-950">
                <div className="font-semibold text-amber-800 dark:text-amber-200">
                  ✓ Carte bien scannée
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  {overlayResult.clientFullName} a déjà 1 tampon aujourd&apos;hui (max 1/jour).
                </div>
              </div>
            ) : (
              <div className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center dark:border-emerald-800 dark:bg-emerald-950">
                <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Visite enregistrée pour {overlayResult.clientFullName} !
                </div>
                {overlayResult.rewardEarned && (
                  <div className="text-sm text-emerald-700 dark:text-emerald-300">
                    🎉 Récompense obtenue : {overlayResult.rewardText} — le compteur repart à 0.
                  </div>
                )}
              </div>
            )}

            <LoyaltyCard
              restaurantName={restaurantName}
              logoInitials={restaurantName.slice(0, 2).toUpperCase()}
              logoUrl={logoUrl}
              stampsEarned={overlayResult.stamps}
              stampsRequired={overlayResult.stampsRequired}
              rewardText={overlayResult.rewardText}
              memberName={overlayResult.clientFullName}
              backgroundColor={backgroundColor}
              backgroundImageUrl={backgroundImageUrl}
            />

            <p className="text-sm text-white/80">Cliquez n&apos;importe où pour continuer</p>
          </div>
        </div>
      )}
    </div>
  );
}
