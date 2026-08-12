"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutRestaurant } from "@/app/restaurant/login/actions";
import { LogoutButton } from "@/components/LogoutButton";

// Full-width themed bar: client search (submits to the Clients page, which
// runs the same server-side search), a link to Notifications, and an account
// menu. On phones it also carries the logo/name, since the sidebar is hidden
// there.
export function RestaurantHeader({
  restaurantName,
  logoUrl,
}: {
  restaurantName: string;
  logoUrl?: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const initials = restaurantName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-[var(--theme-header-bg)] px-4 py-3 text-[var(--theme-header-fg)] md:gap-4 md:px-6">
      <div className="flex shrink-0 items-center gap-2 md:hidden">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-9 w-9 rounded-full bg-white object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-[var(--theme-accent)]">
            {initials}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/restaurant/clients?q=${encodeURIComponent(query.trim())}`);
        }}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white py-1 pl-4 pr-1 shadow-sm md:max-w-xl"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-zinc-400">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 3.4 9.8l3.1 3.1a1 1 0 0 0 1.4-1.4l-3.1-3.1A5.5 5.5 0 0 0 9 3.5Zm-3.5 5.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un client (nom, email, ville)"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[var(--theme-text,#18181b)] outline-none placeholder:text-[var(--theme-text,#18181b)]/40"
        />
        <button
          type="submit"
          className="hidden shrink-0 rounded-full bg-[var(--theme-accent)] px-4 py-2 text-sm font-semibold text-[var(--theme-accent-fg)] sm:block"
        >
          Rechercher
        </button>
      </form>

      <Link
        href="/restaurant/notifications"
        aria-label="Notifications Push"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25 transition-colors hover:bg-white/40"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M10 2a1 1 0 0 1 1 1v.6a5.5 5.5 0 0 1 4 5.3v3.3l1.6 2.4a1 1 0 0 1-.83 1.55H4.23a1 1 0 0 1-.83-1.55L5 12.2V8.9a5.5 5.5 0 0 1 4-5.3V3a1 1 0 0 1 1-1Zm0 16a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2Z" />
        </svg>
      </Link>

      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-white/25 py-1 pl-1 pr-2 transition-colors hover:bg-white/40"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--theme-accent-strong)]">
            {initials}
          </span>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M5.5 7.5 10 12l4.5-4.5H5.5Z" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-black/10 bg-white text-sm text-zinc-900 shadow-lg">
            <div className="border-b border-black/10 px-4 py-3">
              <div className="font-semibold">{restaurantName}</div>
              <div className="text-xs text-zinc-500">Espace entreprise</div>
            </div>
            <Link
              href="/restaurant/parametres"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 hover:bg-zinc-50"
            >
              Paramètres
            </Link>
            <LogoutButton
              action={logoutRestaurant}
              variant="entreprise"
              className="w-full px-4 py-2.5 text-left hover:bg-zinc-50"
            >
              Déconnexion
            </LogoutButton>
          </div>
        )}
      </div>
    </header>
  );
}
