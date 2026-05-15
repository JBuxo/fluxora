import { backendFetch } from "@/app/lib/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const query = new URLSearchParams();
  const from_dt = searchParams.get("from_dt");
  const to_dt = searchParams.get("to_dt");
  if (from_dt) query.set("from_dt", from_dt);
  if (to_dt) query.set("to_dt", to_dt);

  const qs = query.size > 0 ? `?${query.toString()}` : "";
  return backendFetch(`/supply-points/${id}/consumption${qs}`, request);
}
