"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutRestaurant } from "@/app/restaurant/login/actions";
import { HelpButton } from "@/components/HelpButton";
import { NAV_ITEMS } from "./nav-items";
import { NavIcon } from "./NavIcon";

// Desktop/tablet sidebar. Hidden below md (RestaurantBottomNav +
// MoreMenuSheet take over there). Icon-only between md and lg (tablet
// portrait), full width with labels from lg up (tablet landscape/desktop) --
// this is the explicit portrait-vs-landscape differentiation requested,
// not just one merged "tablet" breakpoint.
export function RestaurantSidebar({
  restaurantName,
  logoUrl,
}: {
  restaurantName: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    // sticky + a fixed h-screen (rather than stretching with the flex row)
    // pins the sidebar to the viewport, so adding clients can no longer push
    // "Besoin d'aide ?" and "Déconnexion" below the fold. self-start stops
    // the row from stretching it back to full page height, which would
    // disable sticky.
    <aside className="sticky top-0 hidden h-screen shrink-0 flex-col self-start bg-[var(--theme-sidebar-bg)] md:flex md:w-20 lg:w-64">
      <div className="flex items-center gap-3 px-3 py-5 lg:px-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full bg-white object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--theme-accent)] text-sm font-bold text-[var(--theme-accent-fg)]">
            {restaurantName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="hidden min-w-0 lg:block">
          <div className="truncate font-bold tracking-tight">{restaurantName}</div>
          <div className="truncate text-xs opacity-60">Carte de fidélité</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 lg:p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/restaurant" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                  : "hover:bg-black/5"
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
              <span className="hidden truncate lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-black/10 p-2 lg:p-3">
        <div className="hidden px-2 lg:block">
          <HelpButton direction="up" />
        </div>
        <form action={logoutRestaurant}>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-semibold shadow-sm transition-colors hover:bg-white/70">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0">
              <path d="M6 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5a1 1 0 1 0 0-2H7V5h4a1 1 0 1 0 0-2H6Zm8.3 4.3a1 1 0 0 0-1.4 1.4L14.6 10l-1.7 1.3a1 1 0 1 0 1.4 1.4l3-3a1 1 0 0 0 0-1.4l-3-3Z" />
            </svg>
            <span className="hidden lg:inline">Déconnexion</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
