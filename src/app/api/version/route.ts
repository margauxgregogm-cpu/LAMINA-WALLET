import { NextResponse } from "next/server";

// Vercel bakes VERCEL_GIT_COMMIT_SHA into each deployment's runtime env --
// it's stable for the lifetime of one deployment and changes on every new
// one, so it's a free, zero-config marker for "is a newer version live".
// See src/components/AutoUpdate.tsx, which polls this to auto-reload
// open tabs after a deploy instead of requiring a manual refresh.
export async function GET() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? "dev";
  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
