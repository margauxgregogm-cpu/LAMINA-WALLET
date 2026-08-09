import "server-only";
import { PKPass } from "passkit-generator";

// Mirrors src/lib/google-wallet.ts's shape: an isConfigured() guard plus a
// build function, so the UI can conditionally show the real button only
// once credentials exist, exactly like Google Wallet did before it was set
// up. Nothing here can be tested until Apple approves the Developer Program
// enrollment and a Pass Type ID + signing certificates exist -- see the
// setup checklist below.
//
// Required env vars (all obtained from developer.apple.com once enrollment
// is active):
// - APPLE_WALLET_TEAM_IDENTIFIER: the 10-character Team ID
// - APPLE_WALLET_PASS_TYPE_IDENTIFIER: e.g. "pass.com.laminacards.loyalty",
//   created under Certificates, Identifiers & Profiles > Identifiers > Pass Type IDs
// - APPLE_WALLET_SIGNER_CERT: PEM-encoded Pass Type ID certificate
//   (exported from Keychain Access as .p12, then converted to PEM)
// - APPLE_WALLET_SIGNER_KEY: PEM-encoded private key for that certificate
// - APPLE_WALLET_SIGNER_KEY_PASSPHRASE: passphrase used when exporting the
//   key, if any
// - APPLE_WALLET_WWDR_CERT: PEM-encoded Apple Worldwide Developer Relations
//   intermediate certificate (downloaded from Apple's PKI page, not
//   restaurant-specific -- same value for every pass)
export function isAppleWalletConfigured() {
  return Boolean(
    process.env.APPLE_WALLET_TEAM_IDENTIFIER &&
      process.env.APPLE_WALLET_PASS_TYPE_IDENTIFIER &&
      process.env.APPLE_WALLET_SIGNER_CERT &&
      process.env.APPLE_WALLET_SIGNER_KEY &&
      process.env.APPLE_WALLET_WWDR_CERT
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `rgb(${r}, ${g}, ${b})`;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const DEFAULT_LOGO_URL = "https://placehold.co/660x660/27272a/ffffff.png?text=LW";

export async function buildAppleWalletPass({
  restaurantId,
  restaurantName,
  backgroundColor,
  backgroundImageUrl,
  stampsRequired,
  rewardText,
  clientId,
  clientName,
  stamps,
  logoUrl,
}: {
  restaurantId: string;
  restaurantName: string;
  backgroundColor: string;
  backgroundImageUrl?: string | null;
  stampsRequired: number;
  rewardText: string;
  clientId: string;
  clientName: string;
  stamps: number;
  logoUrl?: string | null;
}): Promise<Buffer> {
  if (!isAppleWalletConfigured()) {
    throw new Error("Apple Wallet is not configured");
  }

  const [iconBuffer, stripBuffer] = await Promise.all([
    fetchImageBuffer(logoUrl || DEFAULT_LOGO_URL),
    backgroundImageUrl ? fetchImageBuffer(backgroundImageUrl) : Promise.resolve(null),
  ]);

  const buffers: Record<string, Buffer> = {
    "icon.png": iconBuffer,
    "icon@2x.png": iconBuffer,
    "logo.png": iconBuffer,
    "logo@2x.png": iconBuffer,
  };
  if (stripBuffer) {
    buffers["strip.png"] = stripBuffer;
    buffers["strip@2x.png"] = stripBuffer;
  }

  // PEM values are stored as single-line env vars with literal "\n"
  // sequences (same convention as GOOGLE_WALLET_PRIVATE_KEY) since actual
  // newlines are awkward to pass through the Vercel CLI / dashboard.
  const pass = new PKPass(
    buffers,
    {
      wwdr: process.env.APPLE_WALLET_WWDR_CERT!.replace(/\\n/g, "\n"),
      signerCert: process.env.APPLE_WALLET_SIGNER_CERT!.replace(/\\n/g, "\n"),
      signerKey: process.env.APPLE_WALLET_SIGNER_KEY!.replace(/\\n/g, "\n"),
      signerKeyPassphrase: process.env.APPLE_WALLET_SIGNER_KEY_PASSPHRASE || undefined,
    },
    {
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_IDENTIFIER!,
      teamIdentifier: process.env.APPLE_WALLET_TEAM_IDENTIFIER!,
      organizationName: "Lamina Fidelity",
      serialNumber: `${restaurantId}-${clientId}`,
      description: `Carte de fidélité ${restaurantName}`,
      backgroundColor: hexToRgb(backgroundColor),
    }
  );

  pass.type = "storeCard";
  pass.headerFields.push({ key: "stamps", label: "TAMPONS", value: `${stamps} / ${stampsRequired}` });
  // Deliberately no primaryFields: on storeCard that slot renders right on
  // top of the strip image, which is exactly where the member name isn't
  // wanted. Keeping it in secondary/auxiliary puts it in the plain text
  // block below the image instead.
  pass.secondaryFields.push({ key: "reward", label: "RÉCOMPENSE", value: rewardText });
  pass.auxiliaryFields.push({ key: "member", label: "MEMBRE", value: clientName });
  pass.setBarcodes(clientId);

  return pass.getAsBuffer();
}
