"use client";

import SupportedDistributorSelector from "@/components/sections/supported-distributor-selector";
import Loader from "@/components/ui/loader";
import { useContract } from "@/hooks/use-contract";

export default function DashboardPage() {
  const { contract, loading } = useContract();

  if (loading || !contract) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Use for debugging not found contracts
  // const contractFound = false;
  // if (!contractFound) {
  //   notFound();
  // }

  return (
    <div className="">
      <h1 className="text-3xl font-bold">{contract.name}</h1>

      <section className="mt-6">
        <h2 className="text-2xl">Upload</h2>
        <p className="text-muted-foreground max-w-lg">
          Select your distributor from the options below and we will guide you
          through the process of uploading your consumption report.
        </p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <SupportedDistributorSelector contractId={contract.id} />
        </div>
      </section>
    </div>
  );
}
