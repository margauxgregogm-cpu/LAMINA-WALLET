"use client";

import { useTransition } from "react";
import { impersonateRestaurant } from "./impersonate-actions";
import { adminSecondaryButtonClass } from "@/components/admin/adminFormClasses";

export function AccessRestaurantButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => impersonateRestaurant(id))}
      disabled={isPending}
      className={adminSecondaryButtonClass}
    >
      {isPending ? "Ouverture..." : "Accéder à l'interface entreprise"}
    </button>
  );
}
