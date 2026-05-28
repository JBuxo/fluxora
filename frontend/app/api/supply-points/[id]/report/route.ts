import { backendFetch } from "@/app/lib/backend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.text();
  return backendFetch(`/supply-points/${id}/report`, request, { method: "POST", body });
}
