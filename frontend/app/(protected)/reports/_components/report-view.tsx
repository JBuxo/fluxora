"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import UsageHeatmap from "@/app/(protected)/dashboard/_components/usage-heatmap";
import { ReportTouBar } from "./report-tou-bar";
import { ReportSuggestions } from "./report-suggestions";
import type { Report } from "@/lib/types/api";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const KPI_CONFIG = (r: Report) => [
  { label: "Total Consumption", value: `${(r.summary.total_kwh / 1000).toFixed(2)} MWh`, sub: `${r.summary.record_count} records` },
  { label: "Total Cost", value: `€${r.summary.total_cost.toFixed(0)}`, sub: "From consumption records" },
  { label: "Avg Daily", value: `${r.summary.avg_daily_kwh} kWh`, sub: "Per day in period" },
  { label: "Trend", value: `${r.summary.trend_pct >= 0 ? "+" : ""}${r.summary.trend_pct.toFixed(1)}%`, sub: "vs prior period" },
];

interface Props {
  report: Report;
  contractName: string;
}

export function ReportView({ report, contractName }: Props) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">{contractName}</h2>
        <p className="text-muted-foreground text-sm">
          {fmt(report.period.from)} – {fmt(report.period.to)} · {report.period.days} days ·{" "}
          {report.supply_point.cups}
        </p>
        <p className="text-xs text-muted-foreground">
          Generated {fmt(report.generated_at)}
        </p>
      </div>

      <Separator />

      {/* KPIs */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KPI_CONFIG(report).map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-semibold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Heatmap + TOU side by side */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Usage Patterns</h3>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <UsageHeatmap data={report.heatmap} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Time-of-Use Split</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTouBar tou={report.tou} />
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Suggestions */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Recommendations</h3>
        <ReportSuggestions suggestions={report.suggestions} />
      </section>
    </div>
  );
}
