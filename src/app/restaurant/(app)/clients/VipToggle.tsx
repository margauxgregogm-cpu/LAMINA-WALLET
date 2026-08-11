"use client";

import { useState } from "react";
import { toggleVip } from "@/app/restaurant/actions";

export function VipToggle({ clientId, initialIsVip }: { clientId: string; initialIsVip: boolean }) {
  const [isVip, setIsVip] = useState(initialIsVip);

  function handleClick() {
    const next = !isVip;
    setIsVip(next); // optimistic — flip immediately, revert if the save fails
    toggleVip(clientId, next).catch(() => setIsVip(!next));
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {isVip ? "Retirer VIP ⭐" : "Marquer VIP"}
    </button>
  );
}
