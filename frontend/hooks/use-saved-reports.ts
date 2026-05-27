"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import type { SavedReportMeta } from "@/lib/types/api";

export function useSavedReports(supplyPointId: string | null) {
  const { authHeader } = useAuth();
  const [reports, setReports] = useState<SavedReportMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!supplyPointId || !authHeader) {
      setLoading(false);
      return;
    }
    fetch(`/api/supply-points/${supplyPointId}/reports`, {
      headers: { Authorization: authHeader },
    })
      .then((r) => r.json())
      .then((data: SavedReportMeta[]) => setReports(data))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [supplyPointId, authHeader]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { reports, loading, refresh };
}
