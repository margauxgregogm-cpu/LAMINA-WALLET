"use client";

import { useState, useTransition } from "react";
import { ConfirmationModal, type ConfirmationModalVariant } from "@/components/ConfirmationModal";

// Wraps an existing logout server action (logoutRestaurant / logoutAdmin)
// with a confirmation step. Renders the exact same trigger markup callers
// already had (className/children preserved) so no visual site changes,
// and only calls the real action -- unchanged -- once the user confirms.
export function LogoutButton({
  action,
  variant,
  className,
  children,
}: {
  action: () => void | Promise<void>;
  variant: ConfirmationModalVariant;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <ConfirmationModal
        open={open}
        variant={variant}
        title="Se déconnecter ?"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmLabel="Se déconnecter"
        pending={isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          startTransition(() => {
            action();
          });
        }}
      />
    </>
  );
}
