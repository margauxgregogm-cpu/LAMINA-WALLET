"use client";

import { useRef, useState } from "react";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";
import { ConfirmationModal, type ConfirmationModalVariant } from "@/components/ConfirmationModal";

// Wraps the existing self-service password-change server action
// (updateOwnPassword / updateOwnAdminPassword) with a confirmation step.
// The <form action={action}> binding is kept intact -- Next's "Programmatic
// form submission" guide calls out requestSubmit() specifically for this
// case, because invoking a Server Action directly with a hand-built
// FormData (bypassing the bound form) skips part of the framework's
// single-roundtrip cookie handling. Confirmed live: that shortcut left the
// session cookie stale right after supabase.auth.updateUser() rotated it,
// kicking the user to a broken "no restaurant" login screen. requestSubmit()
// avoids that entirely -- the actual submission is byte-for-byte what the
// form always did, just gated behind one extra click.
export function PasswordChangeForm({
  action,
  variant,
  inputClassName,
  buttonClassName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  variant: ConfirmationModalVariant;
  inputClassName: string;
  buttonClassName: string;
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
        className="space-y-4"
      >
        <FormField label="Nouveau mot de passe">
          <PasswordInput
            name="newPassword"
            placeholder="6 caractères minimum"
            required
            minLength={6}
            autoComplete="new-password"
            variant={variant}
            className={inputClassName}
          />
        </FormField>
        <SubmitButton pendingChildren="Enregistrement..." className={buttonClassName}>
          Changer le mot de passe
        </SubmitButton>
      </form>
      <ConfirmationModal
        open={open}
        variant={variant}
        title="Modifier le mot de passe ?"
        message="Êtes-vous sûr de vouloir modifier votre mot de passe ?"
        confirmLabel="Confirmer"
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
