// src/app/api/airports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchAirports } from "@/lib/es";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sourcesRaw = req.nextUrl.searchParams.get("sources") ?? "";
    const sources = sourcesRaw ? sourcesRaw.split(",").filter(Boolean) : [];
    const airports = await fetchAirports(sources);
    return NextResponse.json(airports);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
