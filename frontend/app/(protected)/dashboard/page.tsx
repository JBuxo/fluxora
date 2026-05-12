"use client";

import Loader from "@/components/ui/loader";
import { useContract } from "@/hooks/use-contract";
import { notFound, useRouter } from "next/navigation";
import { supportedDistributors } from "@/lib/data/test-data";
import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
  const { contract, loading } = useContract();

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!contract) {
    notFound();
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
          {supportedDistributors.map((distributor, idx) => (
            <Link
              href={
                "/upload?" +
                new URLSearchParams({ c: contract.id, i: distributor.id })
              }
              key={idx}
              className="flex flex-col items-center bg-accent py-4 px-2 rounded-md hover:outline hover:outline-outline"
            >
              <Image
                src={distributor.logoUrl}
                alt={distributor.name}
                height={128}
                width={128}
                unoptimized
              />
              <p className="text-sm font-medium mt-auto">{distributor.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
