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
