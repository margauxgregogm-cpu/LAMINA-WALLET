"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export type ConfirmationModalVariant = "entreprise" | "admin";

const entrepriseConfirmClass =
  "rounded-full bg-[var(--theme-accent,#059669)] px-5 py-2.5 text-sm font-semibold text-[var(--theme-accent-fg,#fff)] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60";
const entrepriseCancelClass =
  "rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60";
const adminConfirmClass =
  "rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-amber-400 disabled:opacity-60";
const adminCancelClass =
  "rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/5 disabled:opacity-60";

// Generic confirmation dialog for sensitive actions (logout, password
// change, ...), shared by both the entreprise and admin interfaces.
// `variant` picks which existing design language the dialog borrows --
// entreprise reuses the per-restaurant --theme-* CSS vars (see Panel.tsx),
// admin reuses the fixed amber/zinc classes from adminFormClasses.ts --
// there is no new theming logic, just the right classes for the context.
export function ConfirmationModal({
  open,
  variant,
  title,
  message,
  cancelLabel = "Annuler",
  confirmLabel = "Confirmer",
  pending = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  variant: ConfirmationModalVariant;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Rendered via a portal straight onto <body> (below) rather than in place:
  // callers mount this inside things like the sticky header (its own
  // z-30 stacking context) or the mobile "more" sheet, so a plain in-tree
  // z-[100] here still gets capped by that ancestor's stacking context and
  // can end up painted behind unrelated same-page content (e.g. the QR
  // scanner's video) that isn't inside that ancestor. Portaling to <body>
  // escapes every ancestor's stacking context, matching how the page's
  // other full-viewport overlays (e.g. the scan result overlay) already
  // reliably paint above the scanner.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  // `open` only ever flips true after user interaction (all callers start
  // it at false via useState), i.e. after hydration -- so document.body is
  // always available by the time this branch runs; no mount-check needed.
  if (!open) return null;

  const isAdmin = variant === "admin";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={pending ? undefined : onCancel} />
      <div
        className={`relative w-full max-w-sm rounded-2xl p-6 shadow-xl ${
          isAdmin
            ? "border border-white/10 bg-zinc-900 text-zinc-100"
            : "bg-[var(--theme-card,#fff)] text-[var(--theme-card-fg,#18181b)]"
        }`}
      >
        <h2 id="confirmation-modal-title" className="text-lg font-bold tracking-tight">
          {title}
        </h2>
        <p className={`mt-2 text-sm ${isAdmin ? "text-zinc-400" : "opacity-70"}`}>{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className={isAdmin ? adminCancelClass : entrepriseCancelClass}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={isAdmin ? adminConfirmClass : entrepriseConfirmClass}
          >
            {pending ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
