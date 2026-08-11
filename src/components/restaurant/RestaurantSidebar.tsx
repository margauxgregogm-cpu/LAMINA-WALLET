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
    <aside className="hidden shrink-0 flex-col border-r border-black/10 bg-white md:flex md:w-16 lg:w-64 dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-center gap-3 border-b border-black/10 px-3 py-4 lg:px-5 dark:border-white/10">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent,#059669)] text-sm font-semibold text-[var(--theme-accent-fg,#fff)]">
            {restaurantName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="hidden truncate font-semibold tracking-tight lg:inline">{restaurantName}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/restaurant" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--theme-accent,#059669)] text-[var(--theme-accent-fg,#fff)]"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
              <span className="hidden truncate lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-black/10 p-2 dark:border-white/10">
        <div className="hidden px-1 lg:block">
          <HelpButton />
        </div>
        <form action={logoutRestaurant}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0">
              <path d="M6 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5a1 1 0 1 0 0-2H7V5h4a1 1 0 1 0 0-2H6Zm8.3 4.3a1 1 0 0 0-1.4 1.4L14.6 10l-1.7 1.3a1 1 0 1 0 1.4 1.4l3-3a1 1 0 0 0 0-1.4l-3-3Z" />
            </svg>
            <span className="hidden truncate lg:inline">Déconnexion</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
