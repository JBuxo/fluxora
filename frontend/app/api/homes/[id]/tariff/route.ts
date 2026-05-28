import { backendFetch } from "@/app/lib/backend";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.text();
  return backendFetch(`/homes/${id}/tariff`, request, { method: "PUT", body });
}
