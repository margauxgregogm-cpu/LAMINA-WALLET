export const formInputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

// Shared "metallic" primary button treatment — a gray gradient instead of a
// flat fill, matching the landing page's look.
export const primaryButtonClass =
  "w-full rounded-full bg-gradient-to-br from-zinc-700 to-zinc-950 px-5 py-3 font-semibold tracking-tight text-white shadow-sm transition-all hover:from-zinc-600 hover:to-zinc-900 disabled:opacity-60 dark:from-zinc-100 dark:to-white dark:text-zinc-900 dark:hover:from-white dark:hover:to-zinc-200";

// Compact inline variant of primaryButtonClass, for links styled as small CTAs.
export const primaryPillLinkClass =
  "rounded-full bg-gradient-to-br from-zinc-700 to-zinc-950 px-4 py-2 text-sm font-semibold tracking-tight text-white shadow-sm transition-all hover:from-zinc-600 hover:to-zinc-900 dark:from-zinc-100 dark:to-white dark:text-zinc-900 dark:hover:from-white dark:hover:to-zinc-200";

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
