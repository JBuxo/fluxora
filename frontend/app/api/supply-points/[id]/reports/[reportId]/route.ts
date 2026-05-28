import { backendFetch } from "@/app/lib/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  return backendFetch(`/supply-points/${id}/reports/${reportId}`, request);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  return backendFetch(`/supply-points/${id}/reports/${reportId}`, request, { method: "DELETE" });
}
