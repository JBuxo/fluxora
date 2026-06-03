import { backendFetch } from "@/app/lib/backend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return backendFetch(`/homes/${id}/recommendations/feedback`, request, { method: "POST" });
}
