import { backendFetch } from "@/app/lib/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return backendFetch(`/homes/${id}/sync-status`, request, { method: "GET" });
}
