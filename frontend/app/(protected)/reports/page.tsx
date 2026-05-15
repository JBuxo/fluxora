"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import { DateRangePicker } from "@/components/sections/date-range-picker";
import { useContract } from "@/hooks/use-contract";
import { useReport } from "@/hooks/use-report";
import { ReportView } from "./_components/report-view";
import { subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { FileTextIcon } from "lucide-react";

export default function ReportsPage() {
  const { contract, contractId, loading } = useContract();
  const { report, loading: reportLoading, error, generate } = useReport(contractId);

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

  function handleGenerate() {
    if (!date?.from || !date?.to) return;
    generate(date.from, date.to);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Select a period and generate a report for {contract.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <DateRangePicker date={date} setDate={setDate} />
          <Button
            onClick={handleGenerate}
            disabled={reportLoading || !date?.from || !date?.to}
          >
            {reportLoading ? "Generating…" : "Generate"}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {reportLoading && (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      )}

      {report && !reportLoading && (
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <FileTextIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Report ready</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportView report={report} contractName={contract.name} />
          </CardContent>
        </Card>
      )}

      {!report && !reportLoading && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
          <FileTextIcon className="h-10 w-10 opacity-30" />
          <p className="text-sm">Select a date range and generate your first report.</p>
        </div>
      )}
    </div>
  );
}
