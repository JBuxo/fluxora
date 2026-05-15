import { backendFetch } from "@/app/lib/backend";

export async function GET(request: Request) {
  return backendFetch("/users/me", request);
}
