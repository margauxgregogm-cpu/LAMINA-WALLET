import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { AutoUpdate } from "@/components/AutoUpdate";

export const metadata: Metadata = {
  title: "Lamina Fidelity — Admin",
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    title: "Lamina Admin",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RegisterServiceWorker />
      <AutoUpdate />
      {children}
    </>
  );
}
