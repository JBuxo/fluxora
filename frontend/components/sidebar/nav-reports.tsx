"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { ConsumptionReport } from "@/lib/types/ui";
import { MoreHorizontalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";

interface Props {
  reports: ConsumptionReport[];
  hasMore?: boolean;
  onDelete?: (report: ConsumptionReport) => void;
}

export function NavReports({ reports, hasMore = false, onDelete }: Props) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Reports</SidebarGroupLabel>
      <SidebarMenu>
        {reports.map((report) => (
          <SidebarMenuItem key={report.url}>
            <SidebarMenuButton asChild>
              <Link href={report.url}>
                <Badge>
                  {report.date.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </Badge>
                <span>{report.name}</span>
              </Link>
            </SidebarMenuButton>
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover className="aria-expanded:bg-muted">
                    <MoreHorizontalIcon />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-40 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(report)}
                  >
                    <Trash2Icon className="text-destructive" />
                    <span>Delete Report</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        ))}

        {reports.length === 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground/70">
              <Link href="/reports/create">
                <PlusIcon className="text-sidebar-foreground/70" />
                <span>Create New</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {hasMore && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground/70">
              <Link href="/reports">
                <MoreHorizontalIcon className="text-sidebar-foreground/70" />
                <span>More</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
