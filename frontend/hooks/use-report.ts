"use client";

import { useState } from "react";
import { useAuth } from "./use-auth";
import type { Report } from "@/lib/types/api";

interface State {
  report: Report | null;
  loading: boolean;
  error: string | null;
}

export function useReport(supplyPointId: string | null) {
  const { authHeader } = useAuth();
  const [state, setState] = useState<State>({ report: null, loading: false, error: null });

  async function generate(fromDate: Date, toDate: Date) {
    if (!supplyPointId || !authHeader) return;

    setState({ report: null, loading: true, error: null });

    const qs = new URLSearchParams({
      from_dt: fromDate.toISOString(),
      to_dt: toDate.toISOString(),
    });

    try {
      const res = await fetch(
        `/api/supply-points/${supplyPointId}/report?${qs}`,
        { headers: { Authorization: authHeader } }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data: Report = await res.json();
      setState({ report: data, loading: false, error: null });
    } catch (e) {
      setState({ report: null, loading: false, error: "Failed to generate report" });
    }
  }

  return { ...state, generate };
}
