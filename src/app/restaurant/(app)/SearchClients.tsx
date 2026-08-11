"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { searchClients, toggleVip } from "../actions";
import { recordVisit } from "./scan/actions";
import { formatRelativeDate } from "@/lib/format-relative-date";

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

export function SearchClients() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [addingVisitId, setAddingVisitId] = useState<string | null>(null);
  const [visitOutcome, setVisitOutcome] = useState<{ id: string; alreadyVisitedToday: boolean } | null>(
    null
  );
  const [visitError, setVisitError] = useState<{ id: string; message: string } | null>(null);

  function runSearch(q: string) {
    startTransition(async () => {
      const data = await searchClients(q);
      setResults(data);
      setSearched(true);
    });
  }

  function handleToggleVip(client: Client) {
    const next = !client.is_vip;
    // optimistic — flip immediately, revert if the save fails
    setResults((prev) => prev.map((c) => (c.id === client.id ? { ...c, is_vip: next } : c)));
    toggleVip(client.id, next).catch(() => {
      setResults((prev) => prev.map((c) => (c.id === client.id ? { ...c, is_vip: !next } : c)));
    });
  }

  async function handleAddVisit(client: Client) {
    setAddingVisitId(client.id);
    setVisitError(null);
    setVisitOutcome(null);
    const result = await recordVisit(client.id);
    setAddingVisitId(null);
    if ("error" in result) {
      setVisitError({ id: client.id, message: result.error ?? "Erreur inconnue" });
      return;
    }
    setResults((prev) =>
      prev.map((c) =>
        c.id === client.id
          ? {
              ...c,
              stamps: result.stamps,
              total_visits: result.alreadyVisitedToday ? c.total_visits : c.total_visits + 1,
              last_visit_at: new Date().toISOString(),
            }
          : c
      )
    );
    setVisitOutcome({ id: client.id, alreadyVisitedToday: result.alreadyVisitedToday });
  }

  return (
    <div className="w-full max-w-5xl">
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
          placeholder="Rechercher un client (nom, email ou ville)"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          Rechercher
        </button>
      </form>

      {searched && (
        <div className="mt-4 flex flex-col gap-3">
          {results.length === 0 && (
            <p className="text-sm text-zinc-500">Aucun client trouvé.</p>
          )}
          {results.map((client) => (
            <div
              key={client.id}
              className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/restaurant/clients/${client.id}`}
                    className="font-semibold underline-offset-2 hover:underline"
                  >
                    {client.first_name} {client.last_name} {client.is_vip && <span title="VIP">⭐</span>}
                  </Link>
                  <div className="text-sm text-zinc-500">
                    {client.email}
                    {client.city ? ` · ${client.city}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleVip(client)}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {client.is_vip ? "Retirer VIP" : "Marquer VIP"}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>Tampons : {client.stamps}</span>
                  <span>Visites totales : {client.total_visits}</span>
                  <span>Dernière visite : {formatRelativeDate(client.last_visit_at)}</span>
                </div>
                <button
                  onClick={() => handleAddVisit(client)}
                  disabled={addingVisitId === client.id}
                  className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {addingVisitId === client.id ? "..." : "Ajouter une visite"}
                </button>
              </div>
              {visitOutcome?.id === client.id && (
                <p
                  className={
                    visitOutcome.alreadyVisitedToday
                      ? "text-xs text-amber-600 dark:text-amber-400"
                      : "text-xs text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {visitOutcome.alreadyVisitedToday
                    ? "Déjà un tampon aujourd'hui (max 1/jour)."
                    : "✓ Visite ajoutée."}
                </p>
              )}
              {visitError?.id === client.id && (
                <p className="text-xs text-red-600 dark:text-red-400">{visitError.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
