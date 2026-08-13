"use client";

import { useState, useTransition } from "react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { updateCommercialConsent } from "./actions";

export function CommercialConsentToggle({
  id,
  consent,
}: {
  id: string;
  consent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5 disabled:opacity-50"
      >
        {isPending ? "..." : consent ? "Retirer le consentement" : "Marquer comme accepté"}
      </button>

      <ConfirmationModal
        open={open}
        variant="entreprise"
        title={consent ? "Retirer le consentement ?" : "Activer les emails commerciaux ?"}
        message={
          consent
            ? "Ce client ne sera plus inclus dans les prochains exports d'emails commerciaux."
            : "Assurez-vous que ce client a réellement exprimé son accord avant d'activer cette option."
        }
        confirmLabel={consent ? "Retirer le consentement" : "Activer"}
        pending={isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          startTransition(() => {
            updateCommercialConsent(id, !consent);
          });
        }}
      />
    </div>
  );
}
