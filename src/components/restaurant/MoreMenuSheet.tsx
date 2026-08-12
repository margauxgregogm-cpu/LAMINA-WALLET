"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutRestaurant } from "@/app/restaurant/login/actions";
import { HelpButton } from "@/components/HelpButton";
import { LogoutButton } from "@/components/LogoutButton";
import { NAV_ITEMS, MOBILE_PRIMARY_HREFS } from "./nav-items";
import { NavIcon } from "./NavIcon";

// Slide-up drawer listing every nav item NOT already in the bottom bar's 4
// primary slots, plus Aide/Déconnexion -- guarantees every desktop nav
// destination stays reachable on a phone.
export function MoreMenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const overflowItems = NAV_ITEMS.filter((item) => !MOBILE_PRIMARY_HREFS.includes(item.href));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-xl dark:bg-zinc-950">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <nav className="flex flex-col gap-1">
          {overflowItems.map((item) => {
            const active = item.href === "/restaurant" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                  active
                    ? "bg-[var(--theme-accent,#059669)] text-[var(--theme-accent-fg,#fff)]"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <div className="px-4 py-2">
            <HelpButton direction="up" />
          </div>
          <LogoutButton
            action={logoutRestaurant}
            variant="entreprise"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0">
              <path d="M6 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5a1 1 0 1 0 0-2H7V5h4a1 1 0 1 0 0-2H6Zm8.3 4.3a1 1 0 0 0-1.4 1.4L14.6 10l-1.7 1.3a1 1 0 1 0 1.4 1.4l3-3a1 1 0 0 0 0-1.4l-3-3Z" />
            </svg>
            Déconnexion
          </LogoutButton>
        </nav>
      </div>
    </div>
  );
}
