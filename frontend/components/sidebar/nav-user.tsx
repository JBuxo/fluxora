"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsUpDownIcon, LoaderCircleIcon, LogOutIcon, RefreshCwIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

interface NewHome {
  id: string;
  name: string;
  cups: string;
}

export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string };
}) {
  const t = useTranslations("user");
  const { isMobile } = useSidebar();
  const { authHeader } = useAuth();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [newHomes, setNewHomes] = useState<NewHome[]>([]);
  const [homeNames, setHomeNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function handleLogout() {
    router.push("/setup");
  }

  async function handleSync() {
    if (!authHeader || syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/datadis/sync", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        const homes: NewHome[] = data.homes ?? [];
        if (homes.length > 0) {
          setNewHomes(homes);
          setHomeNames(Object.fromEntries(homes.map((h) => [h.id, h.name])));
        }
      }
    } finally {
      setSyncing(false);
    }
  }

  async function saveNewHomes() {
    if (!authHeader) return;
    setSaving(true);
    try {
      await Promise.all(
        newHomes.map((h) =>
          fetch(`/api/homes/${h.id}`, {
            method: "PUT",
            headers: { Authorization: authHeader, "Content-Type": "application/json" },
            body: JSON.stringify({ name: homeNames[h.id] ?? h.name }),
          })
        )
      );
    } finally {
      setSaving(false);
      setNewHomes([]);
    }
  }

  return (
    <>
    <Dialog open={newHomes.length > 0} onOpenChange={(open) => { if (!open) setNewHomes([]); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("newHomesTitle", { count: newHomes.length })}</DialogTitle>
          <DialogDescription>
            {t("newHomesDescription", { count: newHomes.length })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {newHomes.map((h) => (
            <div key={h.id} className="space-y-1.5">
              <Label htmlFor={`home-name-${h.id}`}>
                {h.cups}
              </Label>
              <Input
                id={`home-name-${h.id}`}
                value={homeNames[h.id] ?? h.name}
                onChange={(e) => setHomeNames((prev) => ({ ...prev, [h.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setNewHomes([])}>{t("skip")}</Button>
          <Button onClick={saveNewHomes} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <SettingsIcon />
                  {t("settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSync} disabled={syncing}>
                {syncing ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <RefreshCwIcon />
                )}
                {syncing ? t("syncing") : t("syncDatadis")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOutIcon />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    </>
  );
}
