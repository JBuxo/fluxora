import { backendFetch } from "@/app/lib/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return backendFetch(`/homes/${id}/supply-points`, request);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.text();
  return backendFetch(`/supply-points/homes/${id}/supply-points`, request, {
    method: "POST",
    body,
  });
}
