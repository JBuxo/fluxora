"use client";

import Loader from "@/components/ui/loader";
import { useContract } from "@/hooks/use-contract";

export default function AnalyticsPage() {
  const { contract, loading } = useContract();

  if (loading || !contract) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-2xl font-bold">{contract.name} Analytics</h1>
    </div>
  );
}
