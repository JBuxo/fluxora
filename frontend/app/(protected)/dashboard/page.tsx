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
import { useForecast } from "@/hooks/use-forecast";
import { addDays } from "date-fns";
import React from "react";
import { DateRange } from "react-day-picker";
import { ConsumptionTrendLineChart } from "./_components/consumption-line-chart";
import { CumulativeCostAreaChart } from "./_components/consumption-area-chart";
import UsageHeatmap from "./_components/usage-heatmap";
import { AnomalyScatterChart } from "./_components/anomaly-scatter-chart";
import { ConfidenceBandChart } from "./_components/confidence-band-chart";
import { RecommendationEngine } from "./_components/recommendation-section";
import { useAnomalies } from "@/hooks/use-anomalies";

export default function DashboardPage() {
  const { contract, contractId, homeId, loading } = useContract();
  const {
    summary,
    monthly,
    heatmap,
    loading: analyticsLoading,
  } = useConsumptionAnalytics(contractId);
  const { forecast, loading: forecastLoading } = useForecast(homeId);
  const { anomalies, loading: anomaliesLoading } = useAnomalies(homeId);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  });

  const isLoading = loading || analyticsLoading || forecastLoading || anomaliesLoading;

  if (isLoading || !contract) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Use for debugging not found contracts
  // const contractFound = false;
  // if (!contractFound) {
  //   notFound();
  // }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{contract.name}</h1>

      {/* 1. HISTORICAL KPI OVERVIEW (PRIMARY SNAPSHOT) */}
      <section>
        <h2 className="text-2xl">Overview</h2>

        <p className="text-muted-foreground max-w-lg text-pretty">
          High-level snapshot of historical consumption and cost based on
          uploaded distributor reports.
        </p>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: "This Month",
              description: "Consumption to date",
              value: summary ? `${summary.mtd_kwh.toFixed(0)} kWh` : "—",
              hint: analyticsLoading
                ? "Loading…"
                : summary
                  ? `${summary.avg_daily_kwh.toFixed(1)} kWh/day avg`
                  : "No data",
            },
            {
              title: "vs Last Month",
              description: "Same days comparison",
              value: summary
                ? `${summary.vs_last_month_pct >= 0 ? "+" : ""}${summary.vs_last_month_pct.toFixed(1)}%`
                : "—",
              hint: "Same days of last month",
            },
            {
              title: "Spent So Far",
              description: "Variable cost this month",
              value: summary ? `€${summary.mtd_cost.toFixed(2)}` : "—",
              hint: forecast
                ? `at €${forecast.bill_estimate.energy_rate_kwh.toFixed(4)}/kWh`
                : "Based on contract rate",
            },
            {
              title: "Projected Bill",
              description: "End of month estimate",
              value: forecast
                ? `€${forecast.bill_estimate.estimated_bill_eur.toFixed(2)}`
                : "—",
              hint: forecast
                ? `${forecast.bill_estimate.total_projected_kwh.toFixed(0)} kWh total · ${forecast.bill_estimate.days_remaining}d left`
                : "Forecast pending",
            },
          ].map((kpi) => (
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

      {/* 2. HISTORICAL CONSUMPTION TRENDS (CORE VALUE DRIVER) */}
      <section>
        <h2 className="text-2xl">Trends</h2>

        <p className="text-muted-foreground max-w-lg text-pretty">
          Long-term consumption patterns derived from uploaded historical
          reports.
        </p>

        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <ConsumptionTrendLineChart data={monthly} />
          <CumulativeCostAreaChart data={monthly} />
        </div>
      </section>

      {/* =========================
  3. USAGE BEHAVIOR PATTERNS (DERIVED INSIGHTS)
  ========================= */}
      <section>
        <h2 className="text-2xl">Usage Patterns</h2>

        <p className="text-muted-foreground max-w-lg text-pretty">
          Derived behavioral insights from historical consumption data (not
          real-time monitoring).
        </p>

        <div className="mt-4">
          <UsageHeatmap data={heatmap} />
        </div>
      </section>

      {/* =========================
  4. ANOMALY DETECTION (HISTORICAL SPIKE ANALYSIS)
  ========================= */}
      <section>
        <h2 className="text-2xl">Anomalies</h2>

        <p className="text-muted-foreground max-w-lg text-pretty">
          Detection of unusual consumption behavior compared to historical
          baselines.
        </p>

        <div className="mt-4 grid md:grid-cols-3 gap-4 relative">
          <div className="md:col-span-2 space-y-4">
            <AnomalyScatterChart
              data={anomalies.filter((a) => a.is_anomaly)}
              allData={anomalies}
            />
            <ConfidenceBandChart daily={forecast?.daily ?? []} />
          </div>

          <Card className="sticky top-20 self-start h-fit max-h-[calc(100vh-2rem)] overflow-y-auto">
            <CardHeader>
              <CardTitle>Detected Anomalies</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {anomalies.filter((a) => a.is_anomaly).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No anomalies detected in the last 90 days.
                </p>
              )}
              {anomalies
                .filter((a) => a.is_anomaly)
                .map((a) => {
                  const pct =
                    a.predicted_kwh > 0
                      ? Math.round(
                          ((a.actual_kwh - a.predicted_kwh) / a.predicted_kwh) *
                            100,
                        )
                      : 0;
                  return (
                    <div
                      key={a.date}
                      className="flex items-center justify-between rounded-md bg-accent p-2"
                    >
                      <div>
                        <div className="font-medium leading-tight">
                          {a.date}
                        </div>
                        <div className="text-xs text-muted-foreground leading-3">
                          {a.actual_kwh.toFixed(1)} kWh actual ·{" "}
                          {a.predicted_kwh.toFixed(1)} kWh expected
                        </div>
                      </div>
                      <div
                        className={
                          pct >= 0
                            ? "text-destructive font-semibold"
                            : "text-green-600 font-semibold"
                        }
                      >
                        {pct >= 0 ? "+" : ""}
                        {pct}%
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* =========================
  6. RECOMMENDATION ENGINE (FORWARD-LOOKING LAYER)
  ========================= */}
      <section>
        <h2 className="text-2xl">Recommendations</h2>

        <p className="text-muted-foreground max-w-lg text-pretty">
          Small changes based on how you&apos;ve been using energy. Nothing
          drastic - just things that could quietly lower your bill.
        </p>

        <div className="mt-4 space-y-3">
          <RecommendationEngine />
        </div>
      </section>
    </div>
  );
}
