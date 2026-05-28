import { backendFetch } from "@/app/lib/backend";

export async function GET(request: Request) {
  return backendFetch("/homes/with-contracts", request);
}
