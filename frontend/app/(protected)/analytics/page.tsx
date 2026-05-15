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
import { CostEfficiencyChart } from "./_components/cost-efficiency-chart";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsPage() {
  const { contract, contractId, loading } = useContract();
  const { summary, monthly, heatmap, loading: analyticsLoading } = useConsumptionAnalytics(contractId);

  if (loading || !contract) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // ── Derived metrics from heatmap ──────────────────────────────────────────
  const peakPoint = heatmap.reduce(
    (best, p) => (p.avg_kwh > best.avg_kwh ? p : best),
    heatmap[0] ?? { day: 0, hour: 0, avg_kwh: 0, value: 0 },
  );

  const dailyTotals = Array.from({ length: 7 }, (_, d) =>
    heatmap.filter((p) => p.day === d).reduce((s, p) => s + p.avg_kwh, 0),
  );
  const weekdayAvg =
    dailyTotals.slice(0, 5).reduce((s, v) => s + v, 0) / 5;
  const weekendAvg =
    dailyTotals.slice(5).reduce((s, v) => s + v, 0) / 2;
  const weekendUplift =
    weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

  const costPerKwh =
    summary && summary.total_kwh > 0
      ? summary.total_cost / summary.total_kwh
      : null;

  const offPeakKwh = heatmap
    .filter((p) => {
      if (p.day >= 5) return true;
      return p.hour < 8;
    })
    .reduce((s, p) => s + p.avg_kwh, 0);
  const totalHeatmapKwh = heatmap.reduce((s, p) => s + p.avg_kwh, 0);
  const offPeakPct =
    totalHeatmapKwh > 0 ? (offPeakKwh / totalHeatmapKwh) * 100 : 0;

  const kpis = [
    {
      title: "Peak Hour",
      description: "Highest average consumption",
      value: heatmap.length > 0 ? `${peakPoint.hour}:00` : "—",
      hint: heatmap.length > 0
        ? `${DAY_NAMES[peakPoint.day]} · ${peakPoint.avg_kwh.toFixed(3)} kWh avg`
        : analyticsLoading ? "Loading…" : "No data",
    },
    {
      title: "Off-Peak Usage",
      description: "Consumption in cheapest hours",
      value: heatmap.length > 0 ? `${offPeakPct.toFixed(1)}%` : "—",
      hint: "Nights (00–08h) + weekends",
    },
    {
      title: "Avg Cost / kWh",
      description: "Cost efficiency",
      value: costPerKwh !== null ? `€${costPerKwh.toFixed(4)}` : "—",
      hint: analyticsLoading ? "Loading…" : "From consumption records",
    },
    {
      title: "Weekend Uplift",
      description: "vs weekday average",
      value:
        heatmap.length > 0
          ? `${weekendUplift >= 0 ? "+" : ""}${weekendUplift.toFixed(1)}%`
          : "—",
      hint: `Weekday avg ${weekdayAvg.toFixed(1)} kWh · Weekend ${weekendAvg.toFixed(1)} kWh`,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{contract.name} — Analytics</h1>

      {/* 1. KPIs */}
      <section>
        <h2 className="text-2xl">Key Metrics</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          Derived from historical consumption patterns.
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
        <h2 className="text-2xl">Consumption Patterns</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          When and which days you consume the most energy.
        </p>

        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <HourlyProfileChart data={heatmap} />
          <DayProfileChart data={heatmap} />
        </div>
      </section>

      {/* 3. Time-of-use breakdown */}
      <section>
        <h2 className="text-2xl">Time-of-Use Breakdown</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          How your consumption distributes across 2.0TD tariff periods. Shifting
          usage from P1 to P3 directly lowers your bill.
        </p>

        <div className="mt-4">
          <TouBreakdownChart data={heatmap} />
        </div>
      </section>

      {/* 4. Monthly trends */}
      <section>
        <h2 className="text-2xl">Monthly Trends</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          Month-by-month consumption and cost from uploaded distributor reports.
        </p>

        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <ConsumptionTrendLineChart data={monthly} />
          <CumulativeCostAreaChart data={monthly} />
        </div>
      </section>

      {/* 5. Cost efficiency */}
      <section>
        <h2 className="text-2xl">Cost Efficiency</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          Cost per kWh over time. Rising values mean you&apos;re paying more for
          the same unit of energy.
        </p>

        <div className="mt-4">
          <CostEfficiencyChart data={monthly} />
        </div>
      </section>
    </div>
  );
}
