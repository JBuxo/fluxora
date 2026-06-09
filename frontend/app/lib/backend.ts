const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export function backendUrl(path: string): string {
  return `${BACKEND_URL}${path}`;
}

export function proxyHeaders(request: Request): HeadersInit {
  const auth = request.headers.get("authorization");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) headers["Authorization"] = auth;
  return headers;
}

export async function backendFetch(
  path: string,
  request: Request,
  init?: RequestInit
): Promise<Response> {
  const url = backendUrl(path);
  console.log(`[backendFetch] → ${init?.method ?? "GET"} ${url}`);
  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...proxyHeaders(request),
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    console.error(`[backendFetch] network error → ${url}:`, err);
    return new Response(JSON.stringify({ detail: String(err) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
  console.log(`[backendFetch] ← ${res.status} ${url}`);
  if (res.status === 204) return new Response(null, { status: 204 });
  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
