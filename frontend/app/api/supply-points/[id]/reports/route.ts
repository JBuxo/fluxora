import { backendFetch } from "@/app/lib/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return backendFetch(`/supply-points/${id}/reports`, request);
}
