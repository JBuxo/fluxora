import { backendFetch } from "@/app/lib/backend";

export async function GET(request: Request) {
  return backendFetch("/homes", request);
}

export async function POST(request: Request) {
  const body = await request.text();
  return backendFetch("/homes", request, { method: "POST", body });
}
