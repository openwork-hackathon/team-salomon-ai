import { NextResponse } from "next/server";

// Ensure this endpoint is always evaluated at request time (no static caching).
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "team-salomon-ai",
      ts: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        // Explicitly prevent intermediary caches (CDN, proxies) from caching the response.
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
