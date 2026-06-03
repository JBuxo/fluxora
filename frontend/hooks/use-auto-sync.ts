"use client";

import { useEffect } from "react";
import { useAuth } from "./use-auth";

export function useAutoSync(homeId: string | null) {
  const { authHeader } = useAuth();

  useEffect(() => {
    if (!homeId || !authHeader) return;

    fetch(`/api/homes/${homeId}/sync-status`, {
      headers: { Authorization: authHeader },
    })
      .then((r) => r.json())
      .then(({ needs_sync }: { needs_sync: boolean }) => {
        if (!needs_sync) return;

        // Fire-and-forget — no UI blocking
        fetch("/api/datadis/sync", {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }).catch(() => {});
      })
      .catch(() => {});
  }, [homeId, authHeader]);
}
