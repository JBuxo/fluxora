import { backendFetch } from "@/app/lib/backend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return backendFetch(`/datadis/homes/${id}/sync`, request, { method: "POST" });
}
