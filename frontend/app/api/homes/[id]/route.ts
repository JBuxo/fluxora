import { backendFetch } from "@/app/lib/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return backendFetch(`/homes/${id}`, request);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.text();
  return backendFetch(`/homes/${id}`, request, { method: "PUT", body });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return backendFetch(`/homes/${id}`, request, { method: "DELETE" });
}
