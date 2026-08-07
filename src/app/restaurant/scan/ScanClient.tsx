"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { QrScanner } from "@/components/QrScanner";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { lookupClient, recordVisit } from "./actions";

type Client = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  stamps: number;
  is_vip: boolean;
  last_visit_at: string | null;
};

type Lookup = {
  client: Client;
  stampsRequired: number;
  rewardText: string;
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
  const [manualId, setManualId] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
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
    setLookup(null);
    startTransition(async () => {
      const result = await recordVisit(trimmed);
      if ("error" in result) {
        setError(result.error ?? "Erreur inconnue");
        return;
      }
      showVisitResult(result);
    });
  }

  function runLookup(clientId: string) {
    setError(null);
    startTransition(async () => {
      const result = await lookupClient(clientId.trim());
      if ("error" in result) {
        setLookup(null);
        setError(result.error ?? "Erreur inconnue");
      } else {
        setLookup(result);
      }
    });
  }

  function handleAddVisit() {
    if (!lookup) return;
    startTransition(async () => {
      const result = await recordVisit(lookup.client.id);
      if ("error" in result) {
        setError(result.error ?? "Erreur inconnue");
        return;
      }
      setLookup(null);
      showVisitResult(result);
    });
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <QrScanner onScan={runScan} paused={!!overlayResult} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runLookup(manualId);
        }}
        className="flex gap-2"
      >
        <input
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          placeholder="Coller l'ID client manuellement"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isPending || !manualId.trim()}
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

      {lookup && (
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <div className="text-lg font-semibold">
              {lookup.client.first_name} {lookup.client.last_name}
            </div>
            <div className="text-sm text-zinc-500">{lookup.client.email}</div>
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Tampons : {lookup.client.stamps} / {lookup.stampsRequired}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Récompense : {lookup.rewardText}
          </div>
          {lookup.client.last_visit_at && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Dernière visite : {new Date(lookup.client.last_visit_at).toLocaleDateString("fr-FR")}
            </div>
          )}
          {lookup.client.is_vip && (
            <span className="w-fit rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
              VIP
            </span>
          )}
          <button
            onClick={handleAddVisit}
            disabled={isPending}
            className="mt-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? "..." : "Ajouter une visite"}
          </button>
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
