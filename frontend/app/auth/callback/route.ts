import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log(`[auth/callback] code=${code ? "present" : "missing"} next=${next}`);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log(`[auth/callback] exchangeCodeForSession error=${error?.message ?? "none"} user=${data?.user?.id ?? "none"}`);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  console.log("[auth/callback] falling through to login error redirect");
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
