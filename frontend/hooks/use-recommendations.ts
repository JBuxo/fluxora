"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import type { Recommendation, RecommendationsResponse } from "@/lib/types/api";

interface State {
  recommendations: Recommendation[];
  totalSaving: number;
  loading: boolean;
}

export function useRecommendations(homeId: string | null): State & {
  submitFeedback: (
    recommendationId: string,
    recommendationType: string,
    action: string,
    context?: Record<string, unknown>
  ) => Promise<void>;
} {
  const { authHeader } = useAuth();
  const [state, setState] = useState<State>({
    recommendations: [],
    totalSaving: 0,
    loading: true,
  });

  useEffect(() => {
    if (!homeId || !authHeader) {
      setState({ recommendations: [], totalSaving: 0, loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    fetch(`/api/homes/${homeId}/recommendations`, {
      headers: { Authorization: authHeader },
    })
      .then((r) => r.json())
      .then((data: RecommendationsResponse) =>
        setState({
          recommendations: data.recommendations,
          totalSaving: data.total_potential_saving_eur,
          loading: false,
        })
      )
      .catch(() => setState({ recommendations: [], totalSaving: 0, loading: false }));
  }, [homeId, authHeader]);

  const submitFeedback = useCallback(
    async (
      recommendationId: string,
      recommendationType: string,
      action: string,
      context?: Record<string, unknown>
    ) => {
      if (!homeId || !authHeader) return;
      await fetch(`/api/homes/${homeId}/recommendations/feedback`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recommendation_id: recommendationId,
          recommendation_type: recommendationType,
          action,
          context: context ?? null,
        }),
      });
    },
    [homeId, authHeader]
  );

  return { ...state, submitFeedback };
}
