import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { AutoUpdate } from "@/components/AutoUpdate";

export const metadata: Metadata = {
  title: "Lamina Fidelity — Entreprise",
  manifest: "/restaurant-manifest.webmanifest",
  appleWebApp: {
    title: "Lamina Entreprise",
    statusBarStyle: "black-translucent",
  },
};

// Neutral by default (login and other pre-auth routes). Once signed in,
// restaurant/(app)/layout.tsx overrides this with the restaurant's own
// interface colour via generateViewport.
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RegisterServiceWorker />
      <AutoUpdate />
      {children}
    </>
  );
}
