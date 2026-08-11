// Admin is a forced dark theme (not OS-preference-based like the
// entreprise side), so it can't reuse FormField's `formInputClass`/
// `primaryButtonClass` (those rely on Tailwind's `dark:` variant, which
// only activates under prefers-color-scheme -- on a light-OS device that
// would render a light input inside admin's always-dark shell).
export const adminInputClass =
  "w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500";

export const adminButtonClass =
  "w-full rounded-full bg-amber-500 px-5 py-3 font-semibold tracking-tight text-zinc-950 shadow-sm transition-colors hover:bg-amber-400 disabled:opacity-60";

export const adminSecondaryButtonClass =
  "shrink-0 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/5 disabled:opacity-60";
