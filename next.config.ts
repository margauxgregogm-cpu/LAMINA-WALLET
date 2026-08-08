import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next.js caps Server Action request bodies at 1MB by default, well
      // below the Supabase storage bucket's own 2MB->8MB limit — logo/
      // background image uploads were being rejected by Next itself before
      // ever reaching the upload code, with just a generic 500.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
