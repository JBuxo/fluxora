"use client";

import { BreadcrumbLabelsProvider } from "@/contexts/breadcrumb-labels";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return <BreadcrumbLabelsProvider>{children}</BreadcrumbLabelsProvider>;
}
