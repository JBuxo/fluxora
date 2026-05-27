import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import HeaderBreadcrumb from "@/components/sidebar/header-breadcrumb";
import { ClientShell } from "./client-shell";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { backendUrl } from "@/app/lib/backend";

async function hasOnboarded(): Promise<boolean> {
  const token = process.env.NEXT_PUBLIC_DEV_TOKEN ?? "";
  if (!token) return false;
  try {
    const res = await fetch(backendUrl("/homes/with-contracts"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const homes = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return homes.some((h: any) => h.supply_points.length > 0);
  } catch {
    return false;
  }
}

export default async function ProtectedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isOnboarded = await hasOnboarded();
  if (!isOnboarded) redirect("/setup");

  return (
    <SidebarProvider>
      <ClientShell>
      <AppSidebar />
      <SidebarInset>
        <header className="fixed flex h-16 shrink-0 items-center bg-background w-full gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <HeaderBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pb-16 pt-0 mt-16 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </SidebarInset>
      </ClientShell>
    </SidebarProvider>
  );
}
