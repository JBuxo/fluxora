import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import HeaderBreadcrumb from "@/components/sidebar/header-breadcrumb";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// TODO: replace with real check (e.g. fetch user profile from DB)
const isOnboarded = true;

export default function ProtectedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isOnboarded) redirect("/setup");

  return (
    <SidebarProvider>
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-16 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
