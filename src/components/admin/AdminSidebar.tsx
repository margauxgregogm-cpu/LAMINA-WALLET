"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/admin/login/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Entreprises" },
  { href: "/admin/profile", label: "Profil" },
];

// Admin has only 2 real destinations plus logout, and no per-restaurant
// theming (it's the operator's own view) -- one component handles all 4
// breakpoints: a drawer below md, an icon+label column from md up.
export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (onNavigate?: () => void) => (
    <>
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-amber-500/15 text-amber-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <form action={logoutAdmin}>
        <button className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-100">
          Déconnexion
        </button>
      </form>
    </>
  );

  return (
    <>
      {/* Mobile top bar + drawer */}
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950 px-4 py-3 text-zinc-100 md:hidden">
        <span className="font-semibold tracking-tight">Administration</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="rounded-lg p-2 hover:bg-white/5"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M3 5h14v2H3V5Zm0 4h14v2H3V9Zm0 4h14v2H3v-2Z" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col gap-1 bg-zinc-950 p-3 text-zinc-100 shadow-xl">
            <span className="mb-2 px-3 py-2 font-semibold tracking-tight">Administration</span>
            {links(() => setOpen(false))}
          </div>
        </div>
      )}

      {/* Desktop/tablet sidebar */}
      <aside className="hidden shrink-0 flex-col gap-1 border-r border-white/10 bg-zinc-950 p-3 text-zinc-100 md:flex md:w-56">
        <Link href="/admin" className="mb-2 px-3 py-2 font-semibold tracking-tight">
          Administration
        </Link>
        {links()}
      </aside>
    </>
  );
}
