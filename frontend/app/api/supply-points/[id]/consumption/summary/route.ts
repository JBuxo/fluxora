import { backendFetch } from "@/app/lib/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  return backendFetch(`/supply-points/${id}/consumption/summary${qs ? `?${qs}` : ""}`, request);
}
