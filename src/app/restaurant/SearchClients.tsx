"use client";

import { useState, useTransition } from "react";
import { searchClients, toggleVip } from "./actions";
import { formatRelativeDate } from "@/lib/format-relative-date";

type Client = {
  id: string;
  first_name: string;
  email: string;
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

  function runSearch(q: string) {
    startTransition(async () => {
      const data = await searchClients(q);
      setResults(data);
      setSearched(true);
    });
  }

  function handleToggleVip(client: Client) {
    startTransition(async () => {
      await toggleVip(client.id, !client.is_vip);
      setResults((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, is_vip: !c.is_vip } : c))
      );
    });
  }

  return (
    <div className="w-full max-w-2xl">
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
          placeholder="Rechercher un client (nom ou email)"
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
                  <div className="font-semibold">
                    {client.first_name} {client.is_vip && <span title="VIP">⭐</span>}
                  </div>
                  <div className="text-sm text-zinc-500">{client.email}</div>
                </div>
                <button
                  onClick={() => handleToggleVip(client)}
                  disabled={isPending}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {client.is_vip ? "Retirer VIP" : "Marquer VIP"}
                </button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <span>Tampons : {client.stamps}</span>
                <span>Visites totales : {client.total_visits}</span>
                <span>Dernière visite : {formatRelativeDate(client.last_visit_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
