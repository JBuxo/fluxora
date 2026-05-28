import { backendFetch } from "@/app/lib/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  return backendFetch(`/homes/${id}/anomalies${qs ? `?${qs}` : ""}`, request, { method: "GET" });
}
