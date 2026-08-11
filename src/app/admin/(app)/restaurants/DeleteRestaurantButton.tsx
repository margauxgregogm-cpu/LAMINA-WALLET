"use client";

import { useTransition } from "react";
import { deleteRestaurant } from "./actions";

export function DeleteRestaurantButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Supprimer "${name}" ? Cette action est définitive : tous ses clients et leur historique de visites seront aussi supprimés.`
    );
    if (!confirmed) return;

    startTransition(() => {
      deleteRestaurant(id);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
    >
      {isPending ? "Suppression..." : "Supprimer ce restaurant"}
    </button>
  );
}
