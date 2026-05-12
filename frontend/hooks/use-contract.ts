"use client";

import { contracts } from "@/lib/data/test-data";
import { useSearchParams } from "next/navigation";

export function useContract() {
  const searchParams = useSearchParams();

  const contractId = searchParams.get("c");

  const contract = contracts.find((contract) => contract.id === contractId);

  return {
    contractId,
    contract,
    loading: false,
  };
}
