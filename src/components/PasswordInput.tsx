"use client";

import { useId, useState } from "react";
import type { ConfirmationModalVariant } from "@/components/ConfirmationModal";

// Password field with a show/hide toggle. Only ever flips the `type`
// attribute between "password" and "text" -- the value itself is never
// touched, read, logged, or stored anywhere by this component.
export function PasswordInput({
  name,
  id,
  required,
  minLength,
  placeholder,
  defaultValue,
  autoComplete,
  className,
  variant = "entreprise",
}: {
  name: string;
  id?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
  className: string;
  variant?: ConfirmationModalVariant;
}) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const toggleClass =
    variant === "admin"
      ? "text-zinc-500 hover:text-zinc-200"
      : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300";

  return (
    <div className="relative">
      <input
        id={inputId}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-controls={inputId}
        className={`absolute inset-y-0 right-0 flex w-10 items-center justify-center ${toggleClass}`}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z"
      />
      <circle cx={10} cy={10} r={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 2.5l15 15M8.3 8.4a2.5 2.5 0 0 0 3.4 3.4M6.2 6.2C3.7 7.6 1.5 10 1.5 10S4.5 16 10 16c1.5 0 2.8-.4 3.9-1M15.3 13.4C17.2 12 18.5 10 18.5 10S15.5 4 10 4c-.7 0-1.4.1-2 .3"
      />
    </svg>
  );
}
