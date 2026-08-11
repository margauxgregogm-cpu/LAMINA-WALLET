import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node-forge does low-level RSA/PKCS7 arithmetic that Turbopack's bundling
  // was silently miscompiling: certificates and keys parsed fine (same
  // modulus as the source PEMs) but the resulting Apple Wallet pass
  // signature was cryptographically invalid. Keeping these packages
  // unbundled -- loaded via Node's own require() at runtime instead --
  // fixed it.
  serverExternalPackages: ["node-forge", "passkit-generator"],
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
