"use client";

import { useState, useTransition } from "react";
import { toggleVip } from "@/app/restaurant/actions";

export function VipToggle({ clientId, initialIsVip }: { clientId: string; initialIsVip: boolean }) {
  const [isVip, setIsVip] = useState(initialIsVip);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleVip(clientId, !isVip);
      setIsVip(!isVip);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {isVip ? "Retirer VIP ⭐" : "Marquer VIP"}
    </button>
  );
}
