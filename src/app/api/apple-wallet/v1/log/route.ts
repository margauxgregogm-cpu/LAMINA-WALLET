import { NextResponse, type NextRequest } from "next/server";

// Apple posts client-side error logs here. Nothing to act on day-to-day;
// just surface them in the server logs if they ever show up.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { logs?: string[] } | null;
  if (body?.logs?.length) {
    console.error("Apple Wallet device log:", body.logs.join("\n"));
  }
  return new NextResponse(null, { status: 200 });
}
