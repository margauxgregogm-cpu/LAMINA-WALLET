"use client";

import { useRef, useState } from "react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { PushMessageField } from "./PushMessageField";

// Same pattern as PasswordChangeForm: intercept the form's own submit event,
// show a confirmation modal, and only call requestSubmit() once confirmed --
// so the actual submission (message + quota check, see actions.ts) still
// goes through the exact same single-roundtrip server-action path, just
// gated behind one extra click. Cancelling never touches the form or its
// state, so a typed message survives and nothing is sent or charged to the
// quota.
export function PushNotificationForm({
  action,
  canSend,
}: {
  action: (formData: FormData) => void | Promise<void>;
  canSend: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      <form
        ref={formRef}
        action={action}
        onSubmit={(e) => {
          if (confirmedRef.current) {
            confirmedRef.current = false;
            return;
          }
          e.preventDefault();
          setOpen(true);
        }}
      >
        <PushMessageField canSend={canSend} />
      </form>
      <ConfirmationModal
        open={open}
        variant="entreprise"
        title="Envoyer la notification ?"
        message="Êtes-vous sûr de vouloir envoyer cette notification à vos clients ?"
        cancelLabel="Annuler"
        confirmLabel="Envoyer la notification"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          confirmedRef.current = true;
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
