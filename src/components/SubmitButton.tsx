"use client";

import { useFormStatus } from "react-dom";

// Disables itself and swaps its label while the form action is running, so
// an impatient double/triple click can't fire the same server action
// multiple times — that was producing spurious "already saved"-style
// errors on the second submission.
export function SubmitButton({
  children,
  pendingChildren,
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingChildren?: React.ReactNode;
  className?: string;
  /** Extra condition on top of the pending state (e.g. an exhausted quota).
   * Optional and defaults to false, so existing call sites are unaffected. */
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending ? (pendingChildren ?? "...") : children}
    </button>
  );
}
