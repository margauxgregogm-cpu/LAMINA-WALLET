// Shown by src/app/restaurant/loading.tsx while the authenticated layout
// resolves the restaurant's session (Supabase auth + profile row) — the
// data that has to be ready before the entreprise interface can render.
// No artificial delay: Next.js swaps this out the instant that data arrives.
export function SplashScreen() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-white dark:bg-zinc-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lamina-logo.png"
        alt="Lamina Fidelity"
        width={96}
        height={96}
        className="h-20 w-20 rounded-2xl sm:h-24 sm:w-24"
      />
      <div className="flex items-center gap-2">
        {/* Delay set inline, not via a Tailwind class: globals.css's
            .animate-splash-dot rule sits outside any @layer, so per the CSS
            cascade-layers spec it would always beat a layered Tailwind
            utility on the same animation-delay property regardless of
            selector order. Inline style has the highest precedence, so it
            wins cleanly. */}
        <span className="animate-splash-dot h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600" style={{ animationDelay: "0ms" }} />
        <span className="animate-splash-dot h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600" style={{ animationDelay: "0.2s" }} />
        <span className="animate-splash-dot h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}
