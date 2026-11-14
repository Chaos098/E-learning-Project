import { NextResponse } from "next/server";

import { checkDatabase } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  return NextResponse.json(
    { app: "ok", database: database.ok ? "ok" : "error" },
    { status: database.ok ? 200 : 503 },
  );
}
