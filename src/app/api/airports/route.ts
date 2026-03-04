// src/app/api/airports/route.ts
import { NextResponse } from "next/server";
import { fetchAirports } from "@/lib/es";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const airports = await fetchAirports();
    return NextResponse.json(airports);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
