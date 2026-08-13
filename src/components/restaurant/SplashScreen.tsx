// Shown by src/app/restaurant/loading.tsx while the authenticated layout
// resolves the restaurant's session (Supabase auth + profile row), by
// src/app/restaurant/login/LoginForm.tsx the instant the login form is
// submitted, and by src/app/restaurant/launch/page.tsx on cold app opens.
// No artificial delay: every caller swaps this out the instant real data
// arrives. Background is fixed white (not dark-mode-adaptive) on purpose --
// it has to match the PWA manifest's own background_color (#ffffff), which
// the OS uses for the native launch screen right before this takes over, on
// phones in dark mode too (the manifest has no dark variant).
export function SplashScreen() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-white">
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
        <span className="animate-splash-dot h-2.5 w-2.5 rounded-full bg-zinc-400" style={{ animationDelay: "0ms" }} />
        <span className="animate-splash-dot h-2.5 w-2.5 rounded-full bg-zinc-400" style={{ animationDelay: "0.2s" }} />
        <span className="animate-splash-dot h-2.5 w-2.5 rounded-full bg-zinc-400" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}
