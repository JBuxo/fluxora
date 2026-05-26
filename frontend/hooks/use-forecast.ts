"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import type { ForecastResponse } from "@/lib/types/api";

interface State {
  forecast: ForecastResponse | null;
  loading: boolean;
}

export function useForecast(homeId: string | null): State {
  const { authHeader } = useAuth();
  const [state, setState] = useState<State>({ forecast: null, loading: true });

  useEffect(() => {
    if (!homeId || !authHeader) {
      setState({ forecast: null, loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    fetch(`/api/homes/${homeId}/forecast`, { headers: { Authorization: authHeader } })
      .then((r) => r.json())
      .then((forecast) => setState({ forecast, loading: false }))
      .catch(() => setState({ forecast: null, loading: false }));
  }, [homeId, authHeader]);

  return state;
}
