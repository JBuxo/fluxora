"use client";

import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavReports } from "@/components/sidebar/nav-reports";
import { NavUser } from "@/components/sidebar/nav-user";
import { ContractSwitcher } from "@/components/sidebar/contract-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TerminalSquareIcon, BookOpenIcon, ChartColumnBigIcon } from "lucide-react";
import { reports } from "@/lib/data/test-data";
import { withContractParam } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useContracts } from "@/hooks/use-contracts";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: <TerminalSquareIcon /> },
  { title: "Analytics", url: "/analytics", icon: <BookOpenIcon /> },
  { title: "Reports", url: "/reports", icon: <ChartColumnBigIcon /> },
];

const USER = {
  name: "Jose Buxo",
  email: "josebuxojr@gmail.com",
  avatar: "/avatars/shadcn.jpg",
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams();
  const contractId = searchParams.get("c");
  const { contracts, loading } = useContracts();

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
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
        <NavReports reports={reports} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={USER} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
