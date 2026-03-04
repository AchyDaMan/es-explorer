// src/app/api/sources/route.ts
import { NextResponse } from "next/server";
import { fetchSources } from "@/lib/es";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sources = await fetchSources('2026-01');
    return NextResponse.json(sources);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
