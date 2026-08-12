// Single source of truth for entreprise nav links, so the desktop sidebar,
// mobile bottom nav, and the "Plus" overflow sheet can never drift apart.
export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

export type IconName =
  | "dashboard"
  | "scan"
  | "clients"
  | "stats"
  | "vip"
  | "notifications"
  | "settings";

export const NAV_ITEMS: NavItem[] = [
  { href: "/restaurant", label: "Tableau de bord", icon: "dashboard" },
  { href: "/restaurant/scan", label: "Scanner", icon: "scan" },
  { href: "/restaurant/clients", label: "Clients", icon: "clients" },
  { href: "/restaurant/vip", label: "VIP", icon: "vip" },
  { href: "/restaurant/notifications", label: "Notifications Push", icon: "notifications" },
  { href: "/restaurant/parametres", label: "Paramètres", icon: "settings" },
];

// The 4 always-visible items in the mobile bottom bar -- everything else
// (including Tableau de bord, VIP, Paramètres if not listed here, plus
// Aide/Déconnexion) lives in the "Plus" sheet so nothing on desktop becomes
// unreachable on a phone.
export const MOBILE_PRIMARY_HREFS = [
  "/restaurant/scan",
  "/restaurant/clients",
  "/restaurant/notifications",
  "/restaurant/parametres",
];
