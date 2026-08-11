import "server-only";
import { PKPass } from "passkit-generator";
import sharp from "sharp";
import { renderStripImages } from "./apple-wallet-strip";
import { authTokenFor } from "./apple-wallet-auth";
import { supabaseAdmin } from "./supabase-admin";

// Apple requires webServiceURL to be a stable, publicly reachable host --
// a per-deployment Vercel Preview URL changes on every push, so it can't be
// used here. Defaults to the production domain; set APPLE_WALLET_SITE_URL
// to override it, e.g. to a branch's stable Vercel alias
// (lamina-wallet-git-<branch>-<team>.vercel.app) when testing Apple Wallet
// registration/updates end-to-end from a Preview deployment.
const SITE_URL = process.env.APPLE_WALLET_SITE_URL ?? "https://lamina-wallet.vercel.app";

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

// Restaurant logo uploads are full-resolution photos, not pre-sized app
// icons -- embedding them as-is (and reused for all 4 icon/logo slots) was
// producing multi-megabyte .pkpass files, slow enough over cellular that
// Safari looked like it was silently failing to open the Add-to-Wallet
// screen. PassKit's actual on-screen sizes for these are tiny.
async function fetchAndResizeIcon(url: string, size: number): Promise<Buffer> {
  const raw = await fetchImageBuffer(url);
  return sharp(raw).resize(size, size, { fit: "cover" }).png().toBuffer();
}

async function fetchAndResizeLogo(url: string, height: number): Promise<Buffer> {
  const raw = await fetchImageBuffer(url);
  return sharp(raw)
    .resize({ height, width: height * 3, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();
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
  announcementMessage,
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
  /** Restaurant's latest push-notification message, if any -- see
   * migration 012_wallet_announcement.sql for why this is what actually
   * makes a notification appear on the card. */
  announcementMessage?: string | null;
}): Promise<Buffer> {
  if (!isAppleWalletConfigured()) {
    throw new Error("Apple Wallet is not configured");
  }

  const source = logoUrl || DEFAULT_LOGO_URL;
  const [icon1x, icon2x, icon3x, logo1x, logo2x, logo3x, strip] = await Promise.all([
    fetchAndResizeIcon(source, 29),
    fetchAndResizeIcon(source, 58),
    fetchAndResizeIcon(source, 87),
    fetchAndResizeLogo(source, 50),
    fetchAndResizeLogo(source, 100),
    fetchAndResizeLogo(source, 150),
    renderStripImages({
      backgroundColor,
      backgroundImageUrl,
      stampsEarned: stamps,
      stampsRequired,
    }),
  ]);

  const buffers: Record<string, Buffer> = {
    "icon.png": icon1x,
    "icon@2x.png": icon2x,
    "icon@3x.png": icon3x,
    "logo.png": logo1x,
    "logo@2x.png": logo2x,
    "logo@3x.png": logo3x,
    "strip.png": strip.x1,
    "strip@2x.png": strip.x2,
    "strip@3x.png": strip.x3,
  };

  const serialNumber = `${restaurantId}-${clientId}`;

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
      serialNumber,
      description: `Carte de fidélité ${restaurantName}`,
      backgroundColor: hexToRgb(backgroundColor),
      // Lets iOS register this pass for push updates -- see
      // apple-wallet-push.ts and the /api/apple-wallet/v1/* routes.
      webServiceURL: `${SITE_URL}/api/apple-wallet/v1`,
      authenticationToken: authTokenFor(serialNumber),
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

  // Always present (even with a placeholder) so the very first real message
  // is a value CHANGE on a field iOS already knows, not a field appearing
  // out of nowhere -- Apple's notification-on-update behavior is documented
  // for the former, not guaranteed for the latter. changeMessage's "%@" is
  // replaced by the field's new value, so the notification banner shows
  // exactly the restaurant's message text, nothing templated around it.
  pass.backFields.push({
    key: "announcement",
    label: "ACTUALITÉ",
    value: announcementMessage || "Aucune actualité pour le moment.",
    changeMessage: "%@",
  });

  pass.setBarcodes(clientId);

  return pass.getAsBuffer();
}

// Shared by the initial "add to wallet" download route and the PassKit
// web-service "fetch latest pass" route -- both just need a client id.
export async function buildAppleWalletPassForClient(clientId: string): Promise<
  { pass: Buffer; restaurantName: string } | { error: "client_not_found" | "restaurant_not_found" }
> {
  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, stamps, restaurant_id")
    .eq("id", clientId)
    .single();

  if (!client) return { error: "client_not_found" };

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select(
      "name, background_color, background_image_url, stamps_required, reward_text, logo_url, wallet_announcement"
    )
    .eq("id", client.restaurant_id)
    .single();

  if (!restaurant) return { error: "restaurant_not_found" };

  const pass = await buildAppleWalletPass({
    restaurantId: client.restaurant_id,
    restaurantName: restaurant.name,
    backgroundColor: restaurant.background_color,
    backgroundImageUrl: restaurant.background_image_url,
    stampsRequired: restaurant.stamps_required,
    rewardText: restaurant.reward_text,
    clientId: client.id,
    clientName: client.first_name,
    stamps: client.stamps,
    logoUrl: restaurant.logo_url,
    announcementMessage: restaurant.wallet_announcement,
  });

  return { pass, restaurantName: restaurant.name };
}
