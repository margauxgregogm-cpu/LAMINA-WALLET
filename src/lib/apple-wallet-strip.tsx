import "server-only";
import { ImageResponse } from "next/og";
import sharp from "sharp";

// Renders the loyalty-card stamp grid (background + filled/empty circles)
// as a single image, used as the Apple Wallet pass's strip banner. PassKit
// has no native "stamp grid" field -- this is the same trick used by every
// loyalty-card app with a custom Wallet design: bake the visual into an
// image instead of relying on text fields.
//
// The "X / Y" progress counter is NOT drawn here -- it's a separate native
// PassKit headerField (see src/lib/apple-wallet.ts), which is why it stays
// unaffected by displayStyle/stampsRequired=0 below: hiding the circle grid
// never touches the counter, and vice versa.
const STRIP_WIDTH = 1125;
const STRIP_HEIGHT = 432;

const DEFAULT_STAMP_COLOR = "#10b981";

function hexToRgba(hex: string, alpha = 1): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16) || 0;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isValidHexColor(value: string | null | undefined): value is string {
  return Boolean(value && /^#[0-9a-fA-F]{3,8}$/.test(value));
}

// Pre-fetches the stamp image and inlines it as a data URI so a failure
// (dead URL, storage hiccup, corrupted file) is caught here -- before the
// image tree is built -- rather than surfacing as a broken/failed render
// deep inside next/og. Returning null on any failure is the fallback signal
// callers use to draw plain color circles instead, so a bad image can never
// break pass generation.
async function tryFetchStampImageDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    // Re-encode through sharp: guarantees next/og receives a real decodable
    // raster image (not, say, an HTML error page served with a 200 status)
    // and normalizes format/orientation.
    const png = await sharp(buffer).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderStripImages({
  backgroundColor,
  backgroundImageUrl,
  stampsEarned,
  stampsRequired,
  displayStyle = "color",
  stampColor,
  stampImageUrl,
}: {
  backgroundColor: string;
  backgroundImageUrl?: string | null;
  stampsEarned: number;
  stampsRequired: number;
  /** Defaults to "color" so restaurants that predate this option (and any
   * caller that omits it) render exactly like before. */
  displayStyle?: "color" | "image" | "counter";
  stampColor?: string | null;
  stampImageUrl?: string | null;
}): Promise<{ x1: Buffer; x2: Buffer; x3: Buffer }> {
  const filledColor = isValidHexColor(stampColor) ? stampColor : DEFAULT_STAMP_COLOR;

  // "counter" mode and a 0-stamp program both mean "no circle grid" -- only
  // the background (color or image) is drawn, the X/Y headerField elsewhere
  // is what actually carries the progress in that case.
  const showCircles = displayStyle !== "counter" && stampsRequired > 0;

  const stampImageDataUri =
    showCircles && displayStyle === "image" && stampImageUrl
      ? await tryFetchStampImageDataUri(stampImageUrl)
      : null;

  const stamps = showCircles
    ? Array.from({ length: stampsRequired }, (_, i) => i < stampsEarned)
    : [];
  const perRow = stampsRequired > 5 ? Math.ceil(stampsRequired / 2) : stampsRequired;
  const rows: boolean[][] = [];
  for (let i = 0; i < stamps.length; i += perRow) rows.push(stamps.slice(i, i + perRow));

  const circleSize = rows.length > 1 ? 128 : 152;
  const gap = 18;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          position: "relative",
          ...(backgroundImageUrl
            ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: "cover" }
            : { background: backgroundColor }),
        }}
      >
        {backgroundImageUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.55))",
              display: "flex",
            }}
          />
        )}
        {rows.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap, zIndex: 1 }}>
            {rows.map((row, ri) => (
              <div key={ri} style={{ display: "flex", gap }}>
                {row.map((filled, i) => (
                  <div
                    key={i}
                    style={{
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      background: filled ? filledColor : hexToRgba("#ffffff", 0.12),
                      border: filled ? "none" : `3px solid ${hexToRgba("#ffffff", 0.5)}`,
                    }}
                  >
                    {filled && stampImageDataUri && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={stampImageDataUri}
                        alt=""
                        width={circleSize}
                        height={circleSize}
                        style={{ width: circleSize, height: circleSize, objectFit: "cover" }}
                      />
                    )}
                    {filled && !stampImageDataUri && (
                      <svg
                        viewBox="0 0 20 20"
                        fill="white"
                        width={circleSize * 0.45}
                        height={circleSize * 0.45}
                      >
                        <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { width: STRIP_WIDTH, height: STRIP_HEIGHT }
  );

  const x3 = Buffer.from(await image.arrayBuffer());
  const [x2, x1] = await Promise.all([
    sharp(x3).resize(Math.round(STRIP_WIDTH * (2 / 3)), Math.round(STRIP_HEIGHT * (2 / 3))).png().toBuffer(),
    sharp(x3).resize(Math.round(STRIP_WIDTH / 3), Math.round(STRIP_HEIGHT / 3)).png().toBuffer(),
  ]);

  return { x1, x2, x3 };
}
