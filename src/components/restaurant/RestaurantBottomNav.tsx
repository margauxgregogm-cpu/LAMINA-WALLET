"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, MOBILE_PRIMARY_HREFS } from "./nav-items";
import { NavIcon } from "./NavIcon";
import { MoreMenuSheet } from "./MoreMenuSheet";

// Phone-only (md:hidden) bottom bar: the 4 primary destinations plus a
// "Plus" button opening MoreMenuSheet for everything else.
export function RestaurantBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = NAV_ITEMS.filter((item) => MOBILE_PRIMARY_HREFS.includes(item.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-white/10 dark:bg-zinc-950">
        {primaryItems.map((item) => {
          const active = item.href === "/restaurant" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-[var(--theme-accent,#059669)]" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              {item.label.split(" / ")[0]}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M4 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
          </svg>
          Plus
        </button>
      </nav>
      <MoreMenuSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
