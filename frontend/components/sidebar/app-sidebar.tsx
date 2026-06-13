"use client";

import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavReports } from "@/components/sidebar/nav-reports";
import { NavUser } from "@/components/sidebar/nav-user";
import { ContractSwitcher } from "@/components/sidebar/contract-switcher";
import { LocaleSwitcher } from "@/components/locale-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TerminalSquareIcon, BookOpenIcon, ChartColumnBigIcon } from "lucide-react";
import { withContractParam } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useContracts } from "@/hooks/use-contracts";
import { useSavedReports } from "@/hooks/use-saved-reports";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import type { ConsumptionReport } from "@/lib/types/ui";

const NAV_BASE = [
  { key: "dashboard", url: "/dashboard", icon: <TerminalSquareIcon /> },
  { key: "analytics", url: "/analytics", icon: <BookOpenIcon /> },
  { key: "reports", url: "/reports", icon: <ChartColumnBigIcon /> },
] as const;

const USER = {
  name: "Jose Buxo",
  email: "josebuxojr@gmail.com",
  avatar: "/avatars/shadcn.jpg",
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("nav");
  const searchParams = useSearchParams();
  const contractId = searchParams.get("c");
  const { contracts, loading } = useContracts();
  const { reports: savedReports, refresh: refreshReports } = useSavedReports(contractId);
  const { authHeader } = useAuth();

  const sidebarReports: ConsumptionReport[] = savedReports.slice(0, 5).map((r) => ({
    id: r.id,
    name: `${format(new Date(r.period_from), "d MMM")} – ${format(new Date(r.period_to), "d MMM yy")}`,
    url: contractId
      ? withContractParam(`/reports/${r.id}`, contractId)
      : `/reports/${r.id}`,
    date: new Date(r.generated_at),
  }));

  async function handleDeleteReport(report: ConsumptionReport) {
    if (!contractId || !authHeader || !report.id) return;
    await fetch(`/api/supply-points/${contractId}/reports/${report.id}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    refreshReports();
  }

  const navItems = NAV_BASE.map((item) => ({
    title: t(item.key),
    icon: item.icon,
    url: contractId ? withContractParam(item.url, contractId) : item.url,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {!loading && contracts.length > 0 && (
          <ContractSwitcher contracts={contracts} />
        )}
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
        <NavReports
          reports={sidebarReports}
          hasMore={savedReports.length > 5}
          onDelete={handleDeleteReport}
        />
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 pb-1">
          <LocaleSwitcher />
        </div>
        <NavUser user={USER} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
