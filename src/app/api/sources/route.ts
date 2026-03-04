// src/app/api/sources/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchSources } from "@/lib/es";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const airportsRaw = req.nextUrl.searchParams.get("airports") ?? "";
    const airports = airportsRaw ? airportsRaw.split(",").filter(Boolean) : [];
    const sources = await fetchSources("2026-01", airports);
    return NextResponse.json(sources);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
