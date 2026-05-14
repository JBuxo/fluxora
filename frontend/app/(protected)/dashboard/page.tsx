"use client";

import { DateRangePicker } from "@/components/sections/date-range-picker";
import SupportedDistributorSelector from "@/components/sections/supported-distributor-selector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import { useContract } from "@/hooks/use-contract";
import { kpis } from "@/lib/data/test-data";
import { addDays } from "date-fns";
import React from "react";
import { DateRange } from "react-day-picker";
import { ConsumptionTrendLineChart } from "./_components/consumption-line-chart";
import { CumulativeCostAreaChart } from "./_components/consumption-area-chart";
import UsageHeatmap from "./_components/usage-heatmap";
import { Anomaly } from "@/types/anomaly";
import { AnomalyScatterChart } from "./_components/anomaly-scatter-chart";
import { ConfidenceBandChart } from "./_components/confidence-band-chart";
import { RecommendationEngine } from "./_components/recommendation-section";
import { hasDatadis } from "@/lib/data/test-data";
import ConfigWizard from "@/components/sections/config-wizard";

const anomalies: Anomaly[] = [
  { date: "2026-01-03", deviation: 42, reason: "Spike in evening usage" },
  { date: "2026-01-10", deviation: 38, reason: "Unusual weekend load" },
  { date: "2026-01-18", deviation: 51, reason: "Above baseline consumption" },
];

export default function DashboardPage() {
  const { contract, loading } = useContract();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  });

  if (!hasDatadis) {
    return <ConfigWizard />;
  }

  if (loading || !contract) {
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

      {/* <section>
        <h2 className="text-2xl">Upload</h2>
        <p className="text-muted-foreground max-w-lg">
          Select your distributor from the options below and we will guide you
          through the process of uploading your consumption report.
        </p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <SupportedDistributorSelector contractId={contract.id} />
        </div>
      </section> */}

      {/* 1. HISTORICAL KPI OVERVIEW (PRIMARY SNAPSHOT) */}
      <section>
        <h2 className="text-2xl">Overview</h2>

        <p className="text-muted-foreground max-w-lg text-pretty">
          High-level snapshot of historical consumption and cost based on
          uploaded distributor reports.
        </p>

        <div className="mt-4">
          <DateRangePicker date={date} setDate={setDate} />
        </div>

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

      {/* 2. HISTORICAL CONSUMPTION TRENDS (CORE VALUE DRIVER) */}
      <section>
        <h2 className="text-2xl">Trends</h2>

        <p className="text-muted-foreground max-w-lg text-pretty">
          Long-term consumption patterns derived from uploaded historical
          reports.
        </p>

        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <ConsumptionTrendLineChart />
          <CumulativeCostAreaChart />
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
          <UsageHeatmap />
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
            <AnomalyScatterChart />
            <ConfidenceBandChart />
          </div>

          <Card className="sticky top-20 self-start h-fit max-h-[calc(100vh-2rem)] overflow-y-auto">
            <CardHeader>
              <CardTitle>Detected Anomalies</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {anomalies.map((a) => (
                <div
                  key={a.date}
                  className="flex items-center justify-between rounded-md bg-accent p-2"
                >
                  <div>
                    <div className="font-medium leading-tight">{a.date}</div>
                    <div className="text-xs text-muted-foreground leading-3">
                      {a.reason}
                    </div>
                  </div>

                  <div className="text-destructive font-semibold">
                    +{a.deviation}%
                  </div>
                </div>
              ))}
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
