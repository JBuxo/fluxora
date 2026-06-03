import { NextResponse } from "next/server";
import { backendUrl } from "@/app/lib/backend";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = request.headers.get("authorization") ?? "";

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(backendUrl("/internal/forecast-refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": cronSecret,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
