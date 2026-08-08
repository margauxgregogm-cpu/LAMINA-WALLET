import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "Lamina Fidelity — Entreprise",
  manifest: "/restaurant-manifest.webmanifest",
  appleWebApp: {
    title: "Lamina Entreprise",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RegisterServiceWorker />
      {children}
    </>
  );
}
