"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import { useContract } from "@/hooks/use-contract";
import { useAuth } from "@/hooks/use-auth";
import { useSavedReports } from "@/hooks/use-saved-reports";
import { format } from "date-fns";
import { FileTextIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { withContractParam } from "@/lib/utils";
import type { SavedReportMeta } from "@/lib/types/api";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ReportsPage() {
  const t = useTranslations("reports");
  const { contract, contractId, loading } = useContract();
  const { authHeader } = useAuth();
  const searchParams = useSearchParams();
  const contractParam = searchParams.get("c");
  const { reports, loading: reportsLoading, refresh } = useSavedReports(contractId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const url = (path: string) =>
    contractParam ? withContractParam(path, contractParam) : path;

  async function handleDelete(r: SavedReportMeta) {
    if (!contractId || !authHeader) return;
    setDeletingId(r.id);
    await fetch(`/api/supply-points/${contractId}/reports/${r.id}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    setDeletingId(null);
    refresh();
  }

  if (loading || !contract) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{contract.name}</p>
        </div>
        <Button asChild>
          <Link href={url("/reports/create")}>
            <PlusIcon className="h-4 w-4" />
            {t("newReport")}
          </Link>
        </Button>
      </div>

      {reportsLoading && (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      )}

      {!reportsLoading && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-4">
          <FileTextIcon className="h-12 w-12 opacity-25" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">{t("noReports")}</p>
            <p className="text-sm">{t("noReportsDescription")}</p>
          </div>
          <Button asChild>
            <Link href={url("/reports/create")}>
              <PlusIcon className="h-4 w-4" />
              {t("createFirst")}
            </Link>
          </Button>
        </div>
      )}

      {!reportsLoading && reports.length > 0 && (
        <div className="grid gap-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-0.5">
                  <p className="font-medium">
                    {format(new Date(r.period_from), "d MMM yyyy")} –{" "}
                    {format(new Date(r.period_to), "d MMM yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.period_days} {t("days")} · {r.total_kwh.toFixed(1)} kWh · {r.record_count} {t("records")} ·{" "}
                    {t("generated")} {format(new Date(r.generated_at), "d MMM yyyy, HH:mm")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={url(`/reports/${r.id}`)}>{t("view")}</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === r.id}
                    onClick={() => handleDelete(r)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
