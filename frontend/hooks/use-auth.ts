"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAuth() {
  const [token, setToken] = useState("");

  useEffect(() => {
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
