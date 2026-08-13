"use client";

import { useTransition } from "react";
import { updateCommercialConsent } from "./actions";

export function CommercialConsentToggle({
  id,
  consent,
}: {
  id: string;
  consent: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (consent) {
      const confirmed = window.confirm(
        "Retirer le consentement aux emails commerciaux ? Ce client ne sera plus inclus dans les prochains exports."
      );
      if (!confirmed) return;
    }

    startTransition(() => {
      updateCommercialConsent(id, !consent);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">
        Emails commerciaux :{" "}
        {consent ? (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Accepté</span>
        ) : (
          <span className="font-semibold text-zinc-500">Non accepté</span>
        )}
      </span>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5 disabled:opacity-50"
      >
        {isPending ? "..." : consent ? "Retirer le consentement" : "Marquer comme accepté"}
      </button>
    </div>
  );
}
