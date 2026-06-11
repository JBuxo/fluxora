"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export function useAuth() {
  const [token, setToken] = useState(DEV_MODE ? "dev" : "");

  useEffect(() => {
    if (DEV_MODE) return;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? "");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setToken(session?.access_token ?? "");
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    token,
    authHeader: token ? `Bearer ${token}` : "",
  };
}
