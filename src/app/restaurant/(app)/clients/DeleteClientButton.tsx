"use client";

import { useState, useTransition } from "react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { deleteClient } from "./actions";

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        {isPending ? "Suppression..." : "Supprimer ce client"}
      </button>

      <ConfirmationModal
        open={open}
        variant="entreprise"
        title="Supprimer ce client ?"
        message={`Supprimer la fiche de "${name}" ? Cette action est définitive et supprimera aussi son historique de visites.`}
        confirmLabel="Supprimer"
        pending={isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          startTransition(() => {
            deleteClient(id);
          });
        }}
      />
    </>
  );
}
