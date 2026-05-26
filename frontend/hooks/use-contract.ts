"use client";

import { GalleryVerticalEndIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import type { HomeWithContracts } from "@/lib/types/api";

interface ResolvedContract {
  id: string; // supply point id — used for all analytics API calls
  homeId: string;
  name: string;
  tariff: string;
  logo: typeof GalleryVerticalEndIcon;
}

export function useContract() {
  const searchParams = useSearchParams();
  const supplyPointId = searchParams.get("c");
  const { authHeader } = useAuth();

  const [contract, setContract] = useState<ResolvedContract | null>(null);
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
        let resolved: ResolvedContract | null = null;

        for (const home of homes) {
          for (const sp of home.supply_points) {
            const candidate: ResolvedContract = {
              id: sp.id,
              homeId: home.id,
              name: home.name,
              tariff: sp.active_contract?.tariff_name ?? "—",
              logo: GalleryVerticalEndIcon,
            };
            if (!resolved) resolved = candidate;
            if (sp.id === supplyPointId) {
              resolved = candidate;
              break;
            }
          }
        }

        setContract(resolved);
      })
      .catch(() => setContract(null))
      .finally(() => setLoading(false));
  }, [supplyPointId, authHeader]);

  return { contractId: contract?.id ?? null, homeId: contract?.homeId ?? null, contract, loading };
}
