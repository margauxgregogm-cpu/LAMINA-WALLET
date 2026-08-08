import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const logoBase64 = fs
  .readFileSync(path.join(process.cwd(), "public", "lamina-logo.png"))
  .toString("base64");

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
          background: "white",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logoBase64}`}
          alt=""
          width={size * 0.7}
          height={size * 0.7}
        />
      </div>
    ),
    { width: size, height: size }
  );
}
