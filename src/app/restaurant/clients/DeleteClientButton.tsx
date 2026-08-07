"use client";

import { useTransition } from "react";
import { deleteClient } from "./actions";

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Supprimer la fiche de "${name}" ? Cette action est définitive et supprimera aussi son historique de visites.`
    );
    if (!confirmed) return;

    startTransition(() => {
      deleteClient(id);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
    >
      {isPending ? "Suppression..." : "Supprimer ce client"}
    </button>
  );
}
