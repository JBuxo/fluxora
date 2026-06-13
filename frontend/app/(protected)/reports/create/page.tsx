"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import { DateRangePicker } from "@/components/sections/date-range-picker";
import { useContract } from "@/hooks/use-contract";
import { useReport } from "@/hooks/use-report";
import { subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { withContractParam } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function CreateReportPage() {
  const t = useTranslations("reports");
  const { contract, contractId, loading } = useContract();
  const { loading: reportLoading, error, generate } = useReport(contractId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractParam = searchParams.get("c");

  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });

  if (loading || !contract) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  async function handleGenerate() {
    if (!date?.from || !date?.to) return;
    const result = await generate(date.from, date.to);
    if (result?.id) {
      const dest = contractParam
        ? withContractParam(`/reports/${result.id}`, contractParam)
        : `/reports/${result.id}`;
      router.push(dest);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("newReport")}</h1>
        <p className="text-muted-foreground mt-1">{contract.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("selectPeriod")}</CardTitle>
          <CardDescription className="max-w-md">
            {t("selectPeriodDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <DateRangePicker date={date} setDate={setDate} />
          <Button
            onClick={handleGenerate}
            disabled={reportLoading || !date?.from || !date?.to}
          >
            {reportLoading ? t("generating") : t("generate")}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {reportLoading && (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      )}
    </div>
  );
}
