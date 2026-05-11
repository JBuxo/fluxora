export async function GET(request: Request) {
  const response = await fetch("http://localhost:8000/health");
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
