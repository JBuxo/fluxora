"use client";

import { useEffect, useState } from "react";
import { GalleryVerticalEndIcon } from "lucide-react";
import { useAuth } from "./use-auth";
import type { HomeWithContracts } from "@/lib/types/api";
import type { Contract } from "@/lib/types/ui";

export function useContracts(): { contracts: Contract[]; loading: boolean } {
  const { authHeader } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authHeader) {
      setLoading(false);
      return;
    }

    fetch("/api/homes/with-contracts", {
      headers: { Authorization: authHeader },
    })
      .then((r) => r.json())
      .then((homes: HomeWithContracts[]) => {
        setContracts(
          homes.flatMap((home) =>
            home.supply_points.map((sp) => ({
              id: sp.id,
              name: home.name,
              tariff: (sp.address?.split(",")[0] || home.name).trim(),
              logo: GalleryVerticalEndIcon,
            })),
          ),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authHeader]);

  return { contracts, loading };
}
