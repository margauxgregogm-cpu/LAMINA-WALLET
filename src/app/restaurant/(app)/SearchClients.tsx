"use client";

import { useState, useTransition, useEffect, useRef } from "react";
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

export function SearchClients({ initialQuery = "" }: { initialQuery?: string } = {}) {
  const [query, setQuery] = useState(initialQuery);
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

  // Runs the search the header bar handed over via ?q=, so submitting from
  // the header lands on this page with results already showing.
  const ranInitialRef = useRef(false);
  useEffect(() => {
    if (ranInitialRef.current || !initialQuery.trim()) return;
    ranInitialRef.current = true;
    runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

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
    <div className="w-full">
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
          className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm text-[var(--theme-text,#18181b)] placeholder:text-[var(--theme-text,#18181b)]/40 shadow-sm outline-none"
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="shrink-0 rounded-full bg-[var(--theme-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--theme-accent-fg)] shadow-sm disabled:opacity-50"
        >
          Rechercher
        </button>
      </form>

      {searched && (
        <div className="mt-4 flex flex-col gap-3">
          {results.length === 0 && (
            <p className="text-sm opacity-60">Aucun client trouvé.</p>
          )}
          {results.map((client) => (
            <div
              key={client.id}
              className="flex flex-col gap-2 rounded-2xl border border-black/5 bg-[var(--theme-card,#fff)] p-4 text-[var(--theme-card-fg,#18181b)] shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/restaurant/clients/${client.id}`}
                    className="font-semibold underline-offset-2 hover:underline"
                  >
                    {client.first_name} {client.last_name} {client.is_vip && <span title="VIP">⭐</span>}
                  </Link>
                  <div className="truncate text-sm opacity-60">
                    {client.email}
                    {client.city ? ` · ${client.city}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleVip(client)}
                  className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5"
                >
                  {client.is_vip ? "Retirer VIP" : "Marquer VIP"}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm opacity-70">
                  <span>Tampons : {client.stamps}</span>
                  <span>Visites totales : {client.total_visits}</span>
                  <span>Dernière visite : {formatRelativeDate(client.last_visit_at)}</span>
                </div>
                <button
                  onClick={() => handleAddVisit(client)}
                  disabled={addingVisitId === client.id}
                  className="shrink-0 rounded-full bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-[var(--theme-accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
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
