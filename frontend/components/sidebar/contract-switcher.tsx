"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Contract } from "@/types/contract";

export function ContractSwitcher({ contracts }: { contracts: Contract[] }) {
  const { isMobile } = useSidebar();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const contractId = searchParams.get("c");

  const activeContract =
    contracts.find((c) => c.id === contractId) || contracts[0];

  const ActiveLogo = activeContract.logo;

  useEffect(() => {
    if (!contractId && contracts[0]) {
      router.replace(`${pathname}?c=${contracts[0].id}`);
    }
  }, [contractId, contracts, pathname, router]);

  if (!activeContract) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ActiveLogo />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeContract.name}
                </span>
                <span className="truncate text-xs">
                  {activeContract.tariff}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Contracts
            </DropdownMenuLabel>
            {contracts.map((contract, index) => {
              const Logo = contract.logo;

              return (
                <DropdownMenuItem
                  key={contract.id}
                  onClick={() => {
                    router.push(`${pathname}?c=${contract.id}`);
                  }}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Logo className="size-4" />
                  </div>
                  {contract.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add contract
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
