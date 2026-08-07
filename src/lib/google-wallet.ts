import "server-only";
import jwt from "jsonwebtoken";

export function isGoogleWalletConfigured() {
  return Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_WALLET_PRIVATE_KEY
  );
}

// Fallback used until a restaurant has its own uploaded logo (admin feature, later sprint).
const DEFAULT_LOGO_URL = "https://placehold.co/660x660/27272a/ffffff.png?text=LW";

export function buildGoogleWalletSaveUrl({
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
}) {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY!.replace(/\\n/g, "\n");

  const classId = `${issuerId}.restaurant_${restaurantId}`;
  const objectId = `${issuerId}.client_${clientId}`;

  const loyaltyClass = {
    id: classId,
    issuerName: "Lamina Wallet",
    programName: restaurantName,
    reviewStatus: "UNDER_REVIEW",
    hexBackgroundColor: backgroundColor,
    programLogo: {
      sourceUri: { uri: logoUrl || DEFAULT_LOGO_URL },
      contentDescription: {
        defaultValue: { language: "fr", value: `Logo ${restaurantName}` },
      },
    },
    ...(backgroundImageUrl
      ? {
          heroImage: {
            sourceUri: { uri: backgroundImageUrl },
            contentDescription: {
              defaultValue: { language: "fr", value: `Fond ${restaurantName}` },
            },
          },
        }
      : {}),
  };

  const loyaltyObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    accountName: clientName,
    accountId: clientId,
    loyaltyPoints: {
      label: "Tampons",
      balance: { string: `${stamps} / ${stampsRequired}` },
    },
    // Shown directly on the card face next to the stamp count — the
    // textModulesData entry below only shows in the expanded details panel,
    // which clients don't see without tapping into the pass.
    secondaryLoyaltyPoints: {
      label: "Récompense",
      balance: { string: rewardText },
    },
    textModulesData: [{ id: "reward", header: "Récompense", body: rewardText }],
    barcode: { type: "QR_CODE", value: clientId, alternateText: "" },
  };

  const token = jwt.sign(
    {
      iss: serviceAccountEmail,
      aud: "google",
      typ: "savetowallet",
      payload: {
        loyaltyClasses: [loyaltyClass],
        loyaltyObjects: [loyaltyObject],
      },
    },
    privateKey,
    { algorithm: "RS256" }
  );

  return `https://pay.google.com/gp/v/save/${token}`;
}

async function getGoogleWalletAccessToken(): Promise<string> {
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);

  const assertion = jwt.sign(
    {
      iss: serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/wallet_object.issuer",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    privateKey,
    { algorithm: "RS256" }
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google OAuth token error: ${res.status} ${await res.text()}`);
  }

  const { access_token: accessToken } = (await res.json()) as { access_token: string };
  return accessToken;
}

// Updates an already-saved Google Wallet pass so it reflects a new stamp
// count without the client having to re-save it. Best-effort: if the client
// never added the pass to their wallet, the object doesn't exist yet and
// this silently no-ops (a 404 here is expected, not an error).
export async function updateGoogleWalletStamps({
  clientId,
  stamps,
  stampsRequired,
  rewardText,
}: {
  clientId: string;
  stamps: number;
  stampsRequired: number;
  rewardText: string;
}) {
  if (!isGoogleWalletConfigured()) return;

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const objectId = `${issuerId}.client_${clientId}`;

  try {
    const accessToken = await getGoogleWalletAccessToken();
    const res = await fetch(
      `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loyaltyPoints: {
            label: "Tampons",
            balance: { string: `${stamps} / ${stampsRequired}` },
          },
          // Also re-sent here (not just at creation) so passes saved before
          // this field existed pick it up on their next visit, without a
          // separate backfill.
          secondaryLoyaltyPoints: {
            label: "Récompense",
            balance: { string: rewardText },
          },
        }),
      }
    );

    if (!res.ok && res.status !== 404) {
      console.error("Google Wallet stamp update failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Google Wallet stamp update error:", err);
  }
}

// Updates the shared loyaltyClass for a restaurant so already-saved passes
// pick up a design change (background color/image, logo) made in the admin.
// Google only reads the class definition from the JWT the first time it's
// created — later "save" links referencing the same classId don't overwrite
// the stored class, so a design change needs an explicit PATCH here.
// Best-effort: a 404 means no client has saved a pass for this restaurant
// yet, so there's no class to update — not an error.
export async function updateGoogleWalletClassDesign({
  restaurantId,
  restaurantName,
  backgroundColor,
  backgroundImageUrl,
  logoUrl,
}: {
  restaurantId: string;
  restaurantName: string;
  backgroundColor: string;
  backgroundImageUrl?: string | null;
  logoUrl?: string | null;
}) {
  if (!isGoogleWalletConfigured()) return;

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const classId = `${issuerId}.restaurant_${restaurantId}`;

  try {
    const accessToken = await getGoogleWalletAccessToken();
    const res = await fetch(
      `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Omitting reviewStatus on a PATCH resets it to the schema default
          // (APPROVED), which Google rejects for an unpublished issuer —
          // it must be resent on every update, not just at creation.
          reviewStatus: "UNDER_REVIEW",
          hexBackgroundColor: backgroundColor,
          programLogo: {
            sourceUri: { uri: logoUrl || DEFAULT_LOGO_URL },
            contentDescription: {
              defaultValue: { language: "fr", value: `Logo ${restaurantName}` },
            },
          },
          ...(backgroundImageUrl
            ? {
                heroImage: {
                  sourceUri: { uri: backgroundImageUrl },
                  contentDescription: {
                    defaultValue: { language: "fr", value: `Fond ${restaurantName}` },
                  },
                },
              }
            : {}),
        }),
      }
    );

    if (!res.ok && res.status !== 404) {
      console.error("Google Wallet class update failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Google Wallet class update error:", err);
  }
}
