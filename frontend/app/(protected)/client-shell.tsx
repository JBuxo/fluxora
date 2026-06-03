"use client";

import { BreadcrumbLabelsProvider } from "@/contexts/breadcrumb-labels";
import { useContract } from "@/hooks/use-contract";
import { useAutoSync } from "@/hooks/use-auto-sync";

function AutoSyncTrigger() {
  const { homeId } = useContract();
  useAutoSync(homeId);
  return null;
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbLabelsProvider>
      <AutoSyncTrigger />
      {children}
    </BreadcrumbLabelsProvider>
  );
}
