import "server-only";
import jwt from "jsonwebtoken";

const THEME_COLORS: Record<string, string> = {
  anthracite: "#27272a",
  white: "#f4f4f5",
  gray: "#71717a",
  navy: "#172554",
};

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
  colorTheme,
  stampsRequired,
  rewardText,
  clientId,
  clientName,
  stamps,
  logoUrl,
}: {
  restaurantId: string;
  restaurantName: string;
  colorTheme: string;
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
    hexBackgroundColor: THEME_COLORS[colorTheme] ?? THEME_COLORS.anthracite,
    programLogo: {
      sourceUri: { uri: logoUrl || DEFAULT_LOGO_URL },
      contentDescription: {
        defaultValue: { language: "fr", value: `Logo ${restaurantName}` },
      },
    },
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
}: {
  clientId: string;
  stamps: number;
  stampsRequired: number;
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
