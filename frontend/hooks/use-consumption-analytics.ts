"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import type {
  ConsumptionSummary,
  HeatmapPoint,
  MonthlyDataPoint,
  TempCorrelationPoint,
} from "@/lib/types/api";

interface State {
  summary: ConsumptionSummary | null;
  monthly: MonthlyDataPoint[];
  heatmap: HeatmapPoint[];
  tempCorrelation: TempCorrelationPoint[];
  loading: boolean;
}

export function useConsumptionAnalytics(supplyPointId: string | null): State {
  const { authHeader } = useAuth();
  const [state, setState] = useState<State>({
    summary: null,
    monthly: [],
    heatmap: [],
    tempCorrelation: [],
    loading: true,
  });

  useEffect(() => {
    if (!supplyPointId || !authHeader) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    const h = { Authorization: authHeader };
    const base = `/api/supply-points/${supplyPointId}/consumption`;

    Promise.all([
      fetch(`${base}/summary`, { headers: h }).then((r) => r.json()),
      fetch(`${base}/monthly`, { headers: h }).then((r) => r.json()),
      fetch(`${base}/heatmap`, { headers: h }).then((r) => r.json()),
      fetch(`${base}/temp-correlation`, { headers: h }).then((r) => r.json()),
    ])
      .then(([summary, monthly, heatmap, tempCorrelation]) =>
        setState({ summary, monthly, heatmap, tempCorrelation, loading: false })
      )
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, [supplyPointId, authHeader]);

  return state;
}
