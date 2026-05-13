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
import {
  TerminalSquareIcon,
  BookOpenIcon,
  ChartColumnBigIcon,
} from "lucide-react";
import { contracts, reports } from "@/lib/data/test-data";
import { withContractParam } from "@/lib/utils";
import { useSearchParams, usePathname } from "next/navigation";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <TerminalSquareIcon />,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: <BookOpenIcon />,
    },
    {
      title: "Upload",
      url: "/upload",
      icon: <BookOpenIcon />,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: <ChartColumnBigIcon />,
    },
  ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams();

  const contractId = searchParams.get("c");

  const navMainWithContract = data.navMain.map((item) => ({
    ...item,
    url: contractId ? withContractParam(item.url, contractId) : item.url,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ContractSwitcher contracts={contracts} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMainWithContract} />
        <NavReports reports={reports} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
