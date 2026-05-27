import { backendFetch } from "@/app/lib/backend";

export async function POST(request: Request) {
  const body = await request.text();
  return backendFetch("/datadis/sync", request, { method: "POST", body });
}
