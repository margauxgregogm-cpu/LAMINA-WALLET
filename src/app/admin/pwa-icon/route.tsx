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
          background: "#18181b",
          color: "white",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: size * 0.42,
        }}
      >
        LW
      </div>
    ),
    { width: size, height: size }
  );
}
