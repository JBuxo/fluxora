"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import { useContract } from "@/hooks/use-contract";
import { useConsumptionAnalytics } from "@/hooks/use-consumption-analytics";
import { ConsumptionTrendLineChart } from "@/app/(protected)/dashboard/_components/consumption-line-chart";
import { CumulativeCostAreaChart } from "@/app/(protected)/dashboard/_components/consumption-area-chart";
import { HourlyProfileChart } from "./_components/hourly-profile-chart";
import { DayProfileChart } from "./_components/day-profile-chart";
import { TouBreakdownChart } from "./_components/tou-breakdown-chart";
import { TempCorrelationChart } from "./_components/temp-correlation-chart";
import { useTranslations } from "next-intl";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");
  const { contract, contractId, loading } = useContract();
  const { summary, monthly, heatmap, tempCorrelation, loading: analyticsLoading } = useConsumptionAnalytics(contractId);

  if (loading || analyticsLoading || !contract) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const peakPoint = heatmap.reduce(
    (best, p) => (p.avg_kwh > best.avg_kwh ? p : best),
    heatmap[0] ?? { day: 0, hour: 0, avg_kwh: 0, value: 0 },
  );

  const dailyTotals = Array.from({ length: 7 }, (_, d) =>
    heatmap.filter((p) => p.day === d).reduce((s, p) => s + p.avg_kwh, 0),
  );
  const weekdayAvg = dailyTotals.slice(0, 5).reduce((s, v) => s + v, 0) / 5;
  const weekendAvg = dailyTotals.slice(5).reduce((s, v) => s + v, 0) / 2;
  const weekendUplift =
    weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

  const costPerKwh =
    summary && summary.mtd_kwh > 0 ? summary.mtd_cost / summary.mtd_kwh : null;

  const offPeakKwh = heatmap
    .filter((p) => p.day >= 5 || p.hour < 8)
    .reduce((s, p) => s + p.avg_kwh, 0);
  const totalHeatmapKwh = heatmap.reduce((s, p) => s + p.avg_kwh, 0);
  const offPeakPct = totalHeatmapKwh > 0 ? (offPeakKwh / totalHeatmapKwh) * 100 : 0;

  const kpis = [
    {
      title: t("peakHour"),
      description: t("peakHourDescription"),
      value: heatmap.length > 0 ? `${peakPoint.hour}:00` : "—",
      hint: heatmap.length > 0
        ? `${DAY_NAMES[peakPoint.day]} · ${peakPoint.avg_kwh.toFixed(3)} kWh avg`
        : analyticsLoading ? t("loading") : tCommon("noData"),
    },
    {
      title: t("offPeakUsage"),
      description: t("offPeakUsageDescription"),
      value: heatmap.length > 0 ? `${offPeakPct.toFixed(1)}%` : "—",
      hint: t("offPeakHint"),
    },
    {
      title: t("avgCostKwh"),
      description: t("avgCostDescription"),
      value: costPerKwh !== null ? `€${costPerKwh.toFixed(4)}` : "—",
      hint: analyticsLoading ? t("loading") : t("avgCostSource"),
    },
    {
      title: t("weekendUplift"),
      description: t("weekendUpliftDescription"),
      value:
        heatmap.length > 0
          ? `${weekendUplift >= 0 ? "+" : ""}${weekendUplift.toFixed(1)}%`
          : "—",
      hint: `Weekday avg ${weekdayAvg.toFixed(1)} kWh · Weekend ${weekendAvg.toFixed(1)} kWh`,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{contract.name} — {t("keyMetrics").split(" ")[0]}</h1>

      {/* 1. KPIs */}
      <section>
        <h2 className="text-2xl">{t("keyMetrics")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("keyMetricsDescription")}
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader>
                <CardTitle>{kpi.title}</CardTitle>
                <CardDescription>{kpi.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Daily patterns */}
      <section>
        <h2 className="text-2xl">{t("consumptionPatterns")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("consumptionPatternsDescription")}
        </p>
        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <HourlyProfileChart data={heatmap} />
          <DayProfileChart data={heatmap} />
        </div>
      </section>

      {/* 3. Time-of-use breakdown */}
      <section>
        <h2 className="text-2xl">{t("touBreakdown")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("touBreakdownDescription")}
        </p>
        <div className="mt-4">
          <TouBreakdownChart data={heatmap} />
        </div>
      </section>

      {/* 4. Monthly trends */}
      <section>
        <h2 className="text-2xl">{t("monthlyTrends")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("monthlyTrendsDescription")}
        </p>
        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <ConsumptionTrendLineChart data={monthly} />
          <CumulativeCostAreaChart data={monthly} />
        </div>
      </section>

      {/* 5. Temperature vs consumption */}
      <section>
        <h2 className="text-2xl">{t("weatherImpact")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("weatherImpactDescription")}
        </p>
        <div className="mt-4">
          <TempCorrelationChart data={tempCorrelation} />
        </div>
      </section>
    </div>
  );
}
