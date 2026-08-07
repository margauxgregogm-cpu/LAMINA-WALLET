"use client";

import { useState, useTransition } from "react";
import { QrScanner } from "@/components/QrScanner";
import { lookupClient, recordVisit } from "./actions";

type Client = {
  id: string;
  first_name: string;
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
  clientName: string;
  stamps: number;
  stampsRequired: number;
  rewardEarned?: boolean;
  rewardText?: string;
};

export function ScanClient() {
  const [manualId, setManualId] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [visitResult, setVisitResult] = useState<VisitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runScan(clientId: string) {
    setError(null);
    setLookup(null);
    setVisitResult(null);
    startTransition(async () => {
      const result = await recordVisit(clientId.trim());
      if ("error" in result) {
        setError(result.error ?? "Erreur inconnue");
        return;
      }
      setVisitResult(result);
    });
  }

  function runLookup(clientId: string) {
    setError(null);
    setVisitResult(null);
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
      setVisitResult(result);
      setLookup(null);
    });
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <QrScanner onScan={runScan} />

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
            <div className="text-lg font-semibold">{lookup.client.first_name}</div>
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

      {visitResult && visitResult.alreadyVisitedToday && (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950">
          <div className="font-semibold text-amber-800 dark:text-amber-200">
            {visitResult.clientName} a déjà un tampon aujourd&apos;hui.
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-300">
            Tampons : {visitResult.stamps} / {visitResult.stampsRequired} — 1 tampon max par jour.
          </div>
        </div>
      )}

      {visitResult && !visitResult.alreadyVisitedToday && (
        <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950">
          <div className="font-semibold text-emerald-800 dark:text-emerald-200">
            Visite enregistrée pour {visitResult.clientName} !
          </div>
          {visitResult.rewardEarned ? (
            <div className="text-sm text-emerald-700 dark:text-emerald-300">
              🎉 Récompense obtenue : {visitResult.rewardText} — le compteur repart à 0.
            </div>
          ) : (
            <div className="text-sm text-emerald-700 dark:text-emerald-300">
              Tampons : {visitResult.stamps} / {visitResult.stampsRequired}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
