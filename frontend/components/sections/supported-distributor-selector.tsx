import { supportedDistributors } from "@/lib/data/test-data";
import { Contract } from "@/types/contract";
import Image from "next/image";
import Link from "next/link";

export default function SupportedDistributorSelector({
  contractId,
}: {
  contractId: Contract["id"];
}) {
  return (
    <>
      {supportedDistributors.map((distributor, idx) => (
        <Link
          href={
            "/upload?" +
            new URLSearchParams({ c: contractId, i: distributor.id })
          }
          key={idx}
          className="flex flex-col items-center bg-accent py-2 px-4 rounded-md hover:outline hover:outline-outline"
        >
          <Image
            src={distributor.logoUrl}
            alt={distributor.name}
            width={202}
            height={56}
            unoptimized
            className="h-14 w-auto object-contain"
          />
          <p className="text-sm font-medium mt-auto">{distributor.name}</p>
        </Link>
      ))}
    </>
  );
}
