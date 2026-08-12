"use client";

import { useState } from "react";
import { PUSH_MESSAGE_MAX_LENGTH } from "@/lib/push-plans";
import { SubmitButton } from "@/components/SubmitButton";

// Message box + live character counter + send button. Split out as a client
// component only for the counter; the actual send is a server action, and the
// server re-checks length and quota regardless of what happens here.
export function PushMessageField({ canSend }: { canSend: boolean }) {
  const [message, setMessage] = useState("");
  const remaining = PUSH_MESSAGE_MAX_LENGTH - message.length;
  const tooLong = remaining < 0;

  return (
    <>
      <label className="mb-1 block text-sm font-medium">Message de la notification</label>
      <textarea
        name="message"
        rows={4}
        maxLength={PUSH_MESSAGE_MAX_LENGTH}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ex : Profitez de -20 % sur votre prochaine visite cette semaine !"
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[var(--theme-text,#18181b)] placeholder:text-[var(--theme-text,#18181b)]/40 outline-none"
      />
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className={tooLong ? "text-red-600" : "opacity-50"}>
          {message.length} / {PUSH_MESSAGE_MAX_LENGTH} caractères
        </span>
      </div>

      <SubmitButton
        pendingChildren="Envoi en cours..."
        disabled={!canSend || !message.trim() || tooLong}
        className="mt-4 w-full rounded-full bg-[var(--theme-accent,#059669)] px-5 py-3 font-semibold text-[var(--theme-accent-fg,#fff)] shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Envoyer la notification
      </SubmitButton>
    </>
  );
}
