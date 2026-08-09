import "server-only";
import { ImageResponse } from "next/og";
import sharp from "sharp";

// Renders the loyalty-card stamp grid (background + filled/empty circles)
// as a single image, used as the Apple Wallet pass's strip banner. PassKit
// has no native "stamp grid" field -- this is the same trick used by every
// loyalty-card app with a custom Wallet design: bake the visual into an
// image instead of relying on text fields.
const STRIP_WIDTH = 1125;
const STRIP_HEIGHT = 432;

function hexToRgba(hex: string, alpha = 1): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16) || 0;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export async function renderStripImages({
  backgroundColor,
  backgroundImageUrl,
  stampsEarned,
  stampsRequired,
}: {
  backgroundColor: string;
  backgroundImageUrl?: string | null;
  stampsEarned: number;
  stampsRequired: number;
}): Promise<{ x1: Buffer; x2: Buffer; x3: Buffer }> {
  const stamps = Array.from({ length: stampsRequired }, (_, i) => i < stampsEarned);
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
                    background: filled ? "#10b981" : hexToRgba("#ffffff", 0.12),
                    border: filled ? "none" : `3px solid ${hexToRgba("#ffffff", 0.5)}`,
                  }}
                >
                  {filled && (
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
