"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loader";
import { FileTextIcon, ListIcon } from "lucide-react";
import { useContract } from "@/hooks/use-contract";
import { useAuth } from "@/hooks/use-auth";
import { useBreadcrumbLabels } from "@/contexts/breadcrumb-labels";
import { ReportView } from "../_components/report-view";
import type { Report } from "@/lib/types/api";
import { format } from "date-fns";
import Link from "next/link";
import { withContractParam } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function ReportDetailPage() {
  const t = useTranslations("reports");
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const contractId = searchParams.get("c");
  const { contract, loading: contractLoading } = useContract();
  const { authHeader } = useAuth();
  const { setLabel, clearLabel } = useBreadcrumbLabels();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allReportsUrl = contractId ? withContractParam("/reports", contractId) : "/reports";

  useEffect(() => {
    if (!contractId || !authHeader || !id) return;
    setLoading(true);
    fetch(`/api/supply-points/${contractId}/reports/${id}`, {
      headers: { Authorization: authHeader },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data: Report) => {
        setReport(data);
        const from = format(new Date(data.period.from), "d MMM");
        const to = format(new Date(data.period.to), "d MMM yy");
        setLabel(id, `${from} – ${to}`);
      })
      .catch(() => setError(t("notFound")))
      .finally(() => setLoading(false));

    return () => clearLabel(id);
  }, [contractId, authHeader, id, setLabel, clearLabel, t]);

  if (contractLoading || loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
        <FileTextIcon className="h-10 w-10 opacity-30" />
        <p className="text-sm">{error ?? t("notFound")}</p>
        <Button variant="outline" asChild>
          <Link href={allReportsUrl}>{t("backToReports")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("report")}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={allReportsUrl}>
            <ListIcon className="h-4 w-4" />
            {t("allReports")}
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <FileTextIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{t("savedReport")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportView report={report} contractName={contract?.name ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
