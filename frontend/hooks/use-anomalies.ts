"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import type { AnomalyPoint } from "@/lib/types/api";

interface State {
  anomalies: AnomalyPoint[];
  loading: boolean;
}

export function useAnomalies(homeId: string | null, days = 90): State {
  const { authHeader } = useAuth();
  const [state, setState] = useState<State>({ anomalies: [], loading: true });

  useEffect(() => {
    if (!homeId || !authHeader) {
      setState({ anomalies: [], loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    fetch(`/api/homes/${homeId}/anomalies?days=${days}&only_anomalies=false`, {
      headers: { Authorization: authHeader },
    })
      .then((r) => r.json())
      .then((data: AnomalyPoint[]) => setState({ anomalies: data, loading: false }))
      .catch(() => setState({ anomalies: [], loading: false }));
  }, [homeId, days, authHeader]);

  return state;
}
