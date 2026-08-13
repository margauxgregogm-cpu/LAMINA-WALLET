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
  // Ordered by MOBILE_PRIMARY_HREFS (not NAV_ITEMS) so the bar's slot order
  // is controlled independently of the desktop sidebar's order.
  const primaryItems = MOBILE_PRIMARY_HREFS.map((href) => NAV_ITEMS.find((item) => item.href === href)).filter(
    (item) => item !== undefined
  );

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-black/5 bg-[var(--theme-sidebar-bg,#fff)] pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] md:hidden">
        {primaryItems.map((item) => {
          const active = item.href === "/restaurant" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold"
            >
              <span
                className={`flex h-9 w-14 items-center justify-center rounded-full transition-colors ${
                  active
                    ? "bg-[var(--theme-accent,#059669)] text-[var(--theme-accent-fg,#fff)]"
                    : "opacity-60"
                }`}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
              </span>
              <span className={active ? "" : "opacity-60"}>{item.label.split(" / ")[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold opacity-60"
        >
          <span className="flex h-9 w-14 items-center justify-center rounded-full">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M4 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
            </svg>
          </span>
          Plus
        </button>
      </nav>
      <MoreMenuSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
