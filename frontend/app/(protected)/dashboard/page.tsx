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
import { ConsumptionTrendLineChart } from "./_components/consumption-line-chart";
import { CumulativeCostAreaChart } from "./_components/consumption-area-chart";
import UsageHeatmap from "./_components/usage-heatmap";
import { AnomalyScatterChart } from "./_components/anomaly-scatter-chart";
import { ConfidenceBandChart } from "./_components/confidence-band-chart";
import { RecommendationEngine } from "./_components/recommendation-section";
import { useAnomalies } from "@/hooks/use-anomalies";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations();
  const { contract, contractId, homeId, loading } = useContract();
  const {
    summary,
    monthly,
    heatmap,
    loading: analyticsLoading,
  } = useConsumptionAnalytics(contractId);
  const { forecast, loading: forecastLoading } = useForecast(homeId);
  const { anomalies, loading: anomaliesLoading } = useAnomalies(homeId);

  const isLoading =
    loading || analyticsLoading || forecastLoading || anomaliesLoading;

  if (isLoading || !contract) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{contract.name}</h1>

      {/* 1. HISTORICAL KPI OVERVIEW */}
      <section>
        <h2 className="text-2xl">{t("dashboard.overview")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("dashboard.overviewDescription")}
        </p>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: t("kpi.thisMonth"),
              description: t("kpi.thisMonthDescription"),
              value: summary ? `${summary.mtd_kwh.toFixed(0)} kWh` : "—",
              hint: analyticsLoading
                ? t("kpi.loading")
                : summary
                  ? `${summary.avg_daily_kwh.toFixed(1)} kWh/day avg`
                  : t("common.noData"),
            },
            {
              title: t("kpi.vsLastMonth"),
              description: t("kpi.vsLastMonthDescription"),
              value: summary
                ? `${summary.vs_last_month_pct >= 0 ? "+" : ""}${summary.vs_last_month_pct.toFixed(1)}%`
                : "—",
              hint: t("kpi.sameLastMonth"),
            },
            {
              title: t("kpi.spentSoFar"),
              description: t("kpi.spentSoFarDescription"),
              value: summary ? `€${summary.mtd_cost.toFixed(2)}` : "—",
              hint: t("kpi.basedOnRate"),
            },
            {
              title: t("kpi.projectedBill"),
              description: t("kpi.projectedBillDescription"),
              value: forecast
                ? `€${forecast.bill_estimate.bill_low_eur.toFixed(0)} – €${forecast.bill_estimate.bill_high_eur.toFixed(0)}`
                : "—",
              hint: forecast
                ? `~€${forecast.bill_estimate.estimated_bill_eur.toFixed(2)} · ${forecast.bill_estimate.total_projected_kwh.toFixed(0)} kWh · ${forecast.bill_estimate.days_remaining}d left`
                : t("kpi.forecastPending"),
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

      {/* 2. HISTORICAL CONSUMPTION TRENDS */}
      <section>
        <h2 className="text-2xl">{t("dashboard.trends")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("dashboard.trendsDescription")}
        </p>
        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <ConsumptionTrendLineChart data={monthly} />
          <CumulativeCostAreaChart data={monthly} />
        </div>
      </section>

      {/* 3. USAGE BEHAVIOR PATTERNS */}
      <section>
        <h2 className="text-2xl">{t("dashboard.usagePatterns")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("dashboard.usagePatternsDescription")}
        </p>
        <div className="mt-4">
          <UsageHeatmap data={heatmap} />
        </div>
      </section>

      {/* 4. ANOMALY DETECTION */}
      <section>
        <h2 className="text-2xl">{t("dashboard.anomalies")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("dashboard.anomaliesDescription")}
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
              <CardTitle>{t("dashboard.detectedAnomalies")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {anomalies.filter((a) => a.is_anomaly).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.noAnomalies")}
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
                        <div className="font-medium leading-tight">{a.date}</div>
                        <div className="text-xs text-muted-foreground leading-3">
                          {a.actual_kwh.toFixed(1)} {t("dashboard.kwhActual")} ·{" "}
                          {a.predicted_kwh.toFixed(1)} {t("dashboard.kwhExpected")}
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

      {/* 5. RECOMMENDATION ENGINE */}
      <section>
        <h2 className="text-2xl">{t("dashboard.recommendations")}</h2>
        <p className="text-muted-foreground max-w-lg text-pretty">
          {t("dashboard.recommendationsDescription")}
        </p>
        <div className="mt-4 space-y-3">
          <RecommendationEngine homeId={homeId} />
        </div>
      </section>
    </div>
  );
}
