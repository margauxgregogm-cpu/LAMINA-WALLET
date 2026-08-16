"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { recordVisit } from "../scan/actions";
import { addStampsFreely, removeStampsFreely } from "./stamp-actions";

// Placed directly under the loyalty card on the client fiche (never next to
// the client's name, per the requested layout). OFF mode reuses recordVisit
// unchanged -- the exact same function scan/recherche already call, so this
// becomes a genuine 3rd method of attribution with zero divergent business
// logic (subject to the same 1-passage/jour cap and visit history). ON mode
// calls the free-quantity actions instead, which never touch `visits`.
export function AddStampButton({
  clientId,
  clientFullName,
  freeStampManagement,
}: {
  clientId: string;
  clientFullName: string;
  freeStampManagement: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOne, setConfirmOne] = useState(false);
  const [inputMode, setInputMode] = useState<"add" | "remove" | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [pendingAdjustment, setPendingAdjustment] = useState<{
    kind: "add" | "remove";
    quantity: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  function runAddOne() {
    setFeedback(null);
    startTransition(async () => {
      const result = await recordVisit(clientId);
      setConfirmOne(false);
      if ("error" in result) {
        setFeedback({ type: "error", message: result.error ?? "Erreur inconnue" });
        return;
      }
      if (result.alreadyVisitedToday) {
        setFeedback({
          type: "error",
          message: `${clientFullName} a déjà un tampon aujourd'hui (max 1/jour).`,
        });
        return;
      }
      setFeedback({
        type: "success",
        message: result.rewardEarned
          ? `Tampon ajouté ! 🎉 Récompense obtenue : ${result.rewardText} — le compteur repart à 0.`
          : "Tampon ajouté.",
      });
      router.refresh();
    });
  }

  function openQuantityRow(kind: "add" | "remove") {
    setFeedback(null);
    setInputMode(kind);
    setQuantityInput("");
  }

  function validateAndAskConfirm() {
    const n = Number(quantityInput);
    if (!Number.isInteger(n) || n <= 0) {
      setFeedback({
        type: "error",
        message: "Merci d'indiquer un nombre entier de tampons supérieur à 0.",
      });
      return;
    }
    setPendingAdjustment({ kind: inputMode as "add" | "remove", quantity: n });
  }

  function runAdjustment() {
    if (!pendingAdjustment) return;
    const { kind, quantity } = pendingAdjustment;
    setFeedback(null);
    startTransition(async () => {
      const result =
        kind === "add"
          ? await addStampsFreely(clientId, quantity)
          : await removeStampsFreely(clientId, quantity);
      setPendingAdjustment(null);
      setInputMode(null);
      if (!result.ok) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      const cycles = result.cyclesEarned;
      const base =
        kind === "add"
          ? `${quantity} tampon(s) ajouté(s).`
          : `${quantity} tampon(s) retiré(s).`;
      setFeedback({
        type: "success",
        message:
          cycles > 0
            ? `${base} 🎉 ${cycles} récompense(s) obtenue(s) : ${result.rewardText}.`
            : base,
      });
      router.refresh();
    });
  }

  return (
    <div className="mt-4 w-full max-w-md">
      {!freeStampManagement && (
        <button
          type="button"
          onClick={() => setConfirmOne(true)}
          disabled={isPending}
          className="w-full rounded-full bg-[var(--theme-accent,#059669)] px-5 py-3 text-sm font-semibold text-[var(--theme-accent-fg,#fff)] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "..." : "Ajouter un tampon"}
        </button>
      )}

      {freeStampManagement && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => openQuantityRow("add")}
              disabled={isPending}
              className="flex-1 rounded-full bg-[var(--theme-accent,#059669)] px-5 py-3 text-sm font-semibold text-[var(--theme-accent-fg,#fff)] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Ajouter des tampons
            </button>
            <button
              type="button"
              onClick={() => openQuantityRow("remove")}
              disabled={isPending}
              className="flex-1 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-200"
            >
              Retirer des tampons
            </button>
          </div>

          {inputMode && (
            <div className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-[var(--theme-card,#fff)] p-4 text-[var(--theme-card-fg,#18181b)] dark:border-white/10">
              <label className="text-sm font-medium">
                {inputMode === "add" ? "Nombre de tampons à ajouter" : "Nombre de tampons à retirer"}
              </label>
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-[var(--theme-text,#18181b)]"
                placeholder="ex : 5"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode(null)}
                  disabled={isPending}
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-zinc-600 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={validateAndAskConfirm}
                  disabled={isPending || !quantityInput.trim()}
                  className="rounded-full bg-[var(--theme-accent,#059669)] px-4 py-2 text-xs font-semibold text-[var(--theme-accent-fg,#fff)] disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <ConfirmationModal
        open={confirmOne}
        variant="entreprise"
        title="Ajouter un tampon ?"
        message={`Confirmer l'ajout de 1 tampon à ${clientFullName} ?`}
        pending={isPending}
        onCancel={() => setConfirmOne(false)}
        onConfirm={runAddOne}
      />

      <ConfirmationModal
        open={pendingAdjustment !== null}
        variant="entreprise"
        title={pendingAdjustment?.kind === "add" ? "Ajouter des tampons ?" : "Retirer des tampons ?"}
        message={
          pendingAdjustment
            ? pendingAdjustment.kind === "add"
              ? `Confirmer l'ajout de ${pendingAdjustment.quantity} tampon(s) à ${clientFullName} ?`
              : `Confirmer le retrait de ${pendingAdjustment.quantity} tampon(s) à ${clientFullName} ?`
            : ""
        }
        pending={isPending}
        onCancel={() => setPendingAdjustment(null)}
        onConfirm={runAdjustment}
      />
    </div>
  );
}
