// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchDocuments } from "@/lib/es";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const sourcesRaw = sp.get("sources") ?? "";
    const sources = sourcesRaw ? sourcesRaw.split(",").filter(Boolean) : [];
    const airportsRaw = sp.get("airports") ?? "";
    const airports = airportsRaw ? airportsRaw.split(",").filter(Boolean) : [];
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      200,
      Math.max(1, parseInt(sp.get("pageSize") ?? "50", 10) || 50)
    );

    const keyword = sp.get("keyword") ?? "";
    const result = await fetchDocuments(sources, airports, page, pageSize, keyword);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
