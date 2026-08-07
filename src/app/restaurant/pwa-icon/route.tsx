import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const size = Number(request.nextUrl.searchParams.get("size") ?? 512);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#059669",
          color: "white",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: size * 0.42,
        }}
      >
        R
      </div>
    ),
    { width: size, height: size }
  );
}
