"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Tag,
  Repeat2,
  TrendingUp,
  AlertTriangle,
  CloudRain,
  Zap,
  ArrowLeft,
  FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { useRecommendations } from "@/hooks/use-recommendations";
import type { Recommendation } from "@/lib/types/api";

const typeConfig: Record<
  string,
  { label: string; icon: React.ElementType; rail: string; badge: string; saving: string }
> = {
  timing: {
    label: "Timing",
    icon: Clock,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
  tariff: {
    label: "Tariff",
    icon: Tag,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
  forecast: {
    label: "Forecast",
    icon: TrendingUp,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
  anomaly: {
    label: "Alert",
    icon: AlertTriangle,
    rail: "bg-destructive",
    badge: "text-destructive border-border bg-accent",
    saving: "text-destructive",
  },
  appliance: {
    label: "Appliance",
    icon: Zap,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
  weather: {
    label: "Weather",
    icon: CloudRain,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
  habit: {
    label: "Habit",
    icon: Repeat2,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
};

const fallbackConfig = typeConfig.timing;

// ─── Per-type analysis ────────────────────────────────────────────────────────

interface AnalysisStep {
  label: string;
  value: string;
  note?: string;
}

interface Analysis {
  summary: string;
  steps: AnalysisStep[];
  methodology: string;
}

function n(v: unknown, decimals = 1): string {
  return typeof v === "number" ? v.toFixed(decimals) : String(v ?? "—");
}

function pct(v: unknown): string {
  return typeof v === "number" ? `${(v * 100).toFixed(1)}%` : "—";
}

function eur(v: unknown, decimals = 2): string {
  return typeof v === "number" ? `€${v.toFixed(decimals)}` : "—";
}

function getAnalysis(rec: Recommendation): Analysis {
  const d = rec.supporting_data ?? {};

  switch (rec.id) {
    case "timing_shift":
      return {
        summary:
          "We analysed 60 days of hourly consumption and measured what fraction fell inside Spain's 2.0TD peak window (Mon–Fri 10–14h and 18–22h). When peak usage exceeds 40% of total AND the P1–P2 rate gap is above €0.03/kWh, shifting flexible loads saves money.",
        steps: [
          {
            label: "Peak-hour share",
            value: pct(d.peak_pct),
            note: "Threshold to trigger: > 40%",
          },
          {
            label: "P1 rate",
            value: eur(d.p1_rate_eur_kwh, 3),
            note: "Weekday 10–14h, 18–22h",
          },
          {
            label: "P2 rate",
            value: eur(d.p2_rate_eur_kwh, 3),
            note: "All other hours",
          },
          {
            label: "Rate gap (P1 − P2)",
            value: eur(d.rate_delta, 4),
            note: "Threshold to trigger: > €0.030",
          },
          {
            label: "Estimated saving",
            value: eur(rec.potential_saving_eur),
            note: "(peak_pct − 25%) × monthly_kWh × rate_gap",
          },
        ],
        methodology:
          "Saving assumes shifting the usage above the 25% off-peak baseline. Confidence is high when peak share exceeds 55%.",
      };

    case "forecast_spike":
      return {
        summary:
          "We compared your actual consumption over the last 30 days against the model's 30-day forward forecast. A rise above 12% triggers an action alert — there is still time to act before the bill arrives.",
        steps: [
          {
            label: "Actual (last 30 days)",
            value: `${n(d.actual_kwh_30d)} kWh`,
          },
          {
            label: "Forecast (next 30 days)",
            value: `${n(d.forecast_kwh_30d)} kWh`,
          },
          {
            label: "Excess vs last month",
            value: `${n(d.excess_kwh)} kWh`,
            note: "forecast − actual_last_30",
          },
          {
            label: "Deviation",
            value: pct(d.delta_pct),
            note: "Threshold to trigger: > +12%",
          },
          {
            label: "Estimated extra cost",
            value: eur(d.cost_increase_eur),
            note: "excess_kWh × energy rate",
          },
        ],
        methodology:
          "The forecast is a per-home time-series model trained on your historical hourly data. The saving shown is the full excess — shifting loads to off-peak won't eliminate all of it, but can reduce a meaningful portion depending on how much usage is flexible.",
      };

    case "forecast_down":
      return d.suggested_reduction_kw
        ? {
            summary:
              "Your consumption is trending down and has held below last month's level for long enough that your contracted power (potencia contratada) may now be oversized. Contracted power is a fixed daily charge — you pay for it regardless of actual use.",
            steps: [
              {
                label: "Actual (last 30 days)",
                value: `${n(d.actual_kwh_30d)} kWh`,
              },
              {
                label: "Forecast (next 30 days)",
                value: `${n(d.forecast_kwh_30d)} kWh`,
              },
              {
                label: "Drop vs last month",
                value: pct(d.delta_pct),
                note: "Threshold to trigger: > −12%",
              },
              {
                label: "Current contracted power",
                value: `${n(d.current_contracted_kw, 1)} kW`,
              },
              {
                label: "Suggested reduction",
                value: `${n(d.suggested_reduction_kw, 2)} kW`,
                note: "50% of proportional drop — conservative estimate",
              },
              {
                label: "Peak power rate",
                value: eur(d.power_rate_peak_kw_day, 4),
                note: "€/kW/day (P1)",
              },
              {
                label: "Valley power rate",
                value: eur(d.power_rate_valley_kw_day, 4),
                note: "€/kW/day (P2)",
              },
              {
                label: "Potential monthly saving",
                value: eur(rec.potential_saving_eur),
                note: "reduction_kW × (peak_rate + valley_rate) × 30 days",
              },
            ],
            methodology:
              "The reduction is estimated conservatively at 50% of the proportional consumption drop. You should verify your actual peak demand (visible in your distributor bill) before requesting a power change — contracted power must stay above your highest measured demand or you risk tripping the ICP.",
          }
        : {
            summary:
              "Your consumption is on a downward trend. If this reflects a genuine change in behaviour rather than a seasonal dip, your contracted power may be oversized — meaning you're paying fixed charges for capacity you no longer draw.",
            steps: [
              {
                label: "Actual (last 30 days)",
                value: `${n(d.actual_kwh_30d)} kWh`,
              },
              {
                label: "Forecast (next 30 days)",
                value: `${n(d.forecast_kwh_30d)} kWh`,
              },
              {
                label: "Drop vs last month",
                value: pct(d.delta_pct),
                note: "Threshold to trigger: > −12%",
              },
            ],
            methodology:
              "Power rate data was unavailable for your contract so a saving estimate could not be calculated. Check your bill for the potencia term and compare it against your peak demand to assess whether a reduction makes sense.",
          };

    case "anomaly_alert": {
      const dates = Array.isArray(d.anomaly_dates) ? (d.anomaly_dates as string[]) : [];
      return {
        summary:
          "We run a daily anomaly detector on your consumption. Each day's usage is compared to a statistical baseline built from the same weekday and hour patterns in your history. Days where the residual z-score is high are flagged.",
        steps: [
          {
            label: "Anomalies in last 14 days",
            value: String(d.anomaly_count ?? "—"),
            note: "Threshold to trigger: ≥ 2",
          },
          {
            label: "Flagged dates",
            value: dates.join(", ") || "—",
          },
          {
            label: "Worst spike (z-score)",
            value: n(d.max_z_score, 2),
            note: "z > 2.5 considered anomalous",
          },
          {
            label: "Unexplained excess",
            value: eur(rec.potential_saving_eur),
            note: "Sum of positive residuals × €0.15/kWh",
          },
        ],
        methodology:
          "Z-score is calculated as (actual − predicted) / σ where σ is the rolling standard deviation of residuals for that hour/weekday slot. A stuck appliance, HVAC fault, or upload error are the most common causes.",
      };
    }

    case "tariff_savings":
      return {
        summary:
          "We modelled your monthly energy cost under two scenarios: your current 2.0TD time-of-use tariff and a hypothetical flat-rate tariff priced at the same weighted average. If your usage pattern is peak-heavy, a flat rate can be cheaper.",
        steps: [
          {
            label: "P1 usage / month",
            value: `${n(d.p1_kwh_monthly)} kWh`,
            note: "Peak hours (Mon–Fri 10–14h, 18–22h)",
          },
          {
            label: "P2 usage / month",
            value: `${n(d.p2_kwh_monthly)} kWh`,
            note: "All other hours",
          },
          {
            label: "Current monthly cost",
            value: eur(d.current_monthly_cost_eur),
            note: "P1_kWh × P1_rate + P2_kWh × P2_rate",
          },
          {
            label: "Potential saving",
            value: eur(rec.potential_saving_eur),
            note: "flat_cost − current_cost (threshold: > €8/month)",
          },
        ],
        methodology:
          "Flat rate is modelled as (P1_rate + P2_rate) / 2 applied to total kWh. This is an approximation — actual alternative tariff prices vary by provider. Confidence is low because tariff availability depends on your location and supplier.",
      };

    case "appliance_offpeak":
      return {
        summary:
          "Your usage profile lists high-draw appliances. We estimate how much of their consumption currently falls in peak hours and calculate the saving from shifting it to off-peak.",
        steps: [
          {
            label: "High-draw appliances",
            value: Array.isArray(d.high_draw_appliances)
              ? (d.high_draw_appliances as string[]).join(", ")
              : "—",
          },
          {
            label: "Estimated shiftable usage",
            value: `${n(d.estimated_shiftable_kwh_month)} kWh/month`,
            note: "Per-appliance estimate × 70% assumed in peak",
          },
          {
            label: "Rate gap (P1 − P2)",
            value: eur(
              typeof d.p1_rate_eur_kwh === "number" && typeof d.p2_rate_eur_kwh === "number"
                ? d.p1_rate_eur_kwh - d.p2_rate_eur_kwh
                : null,
              4
            ),
          },
          {
            label: "Potential saving",
            value: eur(rec.potential_saving_eur),
            note: "shiftable_kWh × rate_gap",
          },
        ],
        methodology:
          "Appliance kWh estimates are fixed reference values (EV: 150 kWh/mo, AC: 60 kWh/mo, dryer: 30 kWh/mo). The 70% peak assumption is conservative — actual saving depends on your scheduling habits.",
      };

    case "weather_sensitivity":
      return {
        summary:
          "We calculated the Pearson correlation between your daily consumption and daily mean temperature over the last 60 days. A strong correlation means your energy use is driven by heating or cooling, making you sensitive to weather.",
        steps: [
          {
            label: "Correlation coefficient (r)",
            value: n(d.temp_consumption_correlation, 3),
            note: "|r| > 0.5 triggers this insight, > 0.65 = medium confidence",
          },
          {
            label: "Data points",
            value: String(d.data_points ?? "—"),
            note: "Days with both consumption and weather records",
          },
        ],
        methodology:
          "r > 0 means consumption rises as temperature rises (cooling-driven). r < 0 means it rises as temperature falls (heating-driven). A high |r| suggests insulation improvements or heat pump upgrades would have meaningful impact.",
      };

    default:
      return {
        summary: rec.detail,
        steps: Object.entries(d).map(([k, v]) => ({
          label: k.replace(/_/g, " "),
          value: Array.isArray(v) ? v.join(", ") : String(v),
        })),
        methodology: "",
      };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuggestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const homeId = searchParams.get("homeId");

  const { recommendations, loading } = useRecommendations(homeId);
  const rec = recommendations.find((r) => r.id === id);

  const cfg = rec ? (typeConfig[rec.type] ?? fallbackConfig) : fallbackConfig;
  const Icon = cfg.icon;

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
        <TrendingUp className="h-10 w-10 opacity-30" />
        <p className="text-sm">Suggestion not found or no longer active.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const analysis = getAnalysis(rec);

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cfg.badge}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
          {rec.confidence !== "low" && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-border capitalize">
              {rec.confidence} confidence
            </Badge>
          )}
        </div>

        <h1 className="text-2xl font-semibold leading-snug">{rec.title}</h1>

        {rec.potential_saving_eur > 0 && (
          <div className="inline-flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Potential saving
            </span>
            <span className={cn("font-mono text-3xl font-bold tabular-nums", cfg.saving)}>
              ~€{Math.round(rec.potential_saving_eur)}
              <span className="text-sm font-normal text-muted-foreground ml-1">/month</span>
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* How we got here */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            How we arrived at this
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground max-w-prose">
          {analysis.summary}
        </p>

        {/* Calculation steps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calculation breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {analysis.steps.map((step, i) => (
              <div key={i}>
                {i > 0 && <Separator className="my-3" />}
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-0.5">
                    <div className="text-sm">{step.label}</div>
                    {step.note && (
                      <div className="text-xs text-muted-foreground">{step.note}</div>
                    )}
                  </div>
                  <div className="text-sm font-mono font-semibold tabular-nums text-right shrink-0">
                    {step.value}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Methodology note */}
        {analysis.methodology && (
          <p className="text-xs leading-relaxed text-muted-foreground border-l-2 border-border pl-3">
            {analysis.methodology}
          </p>
        )}
      </div>
    </div>
  );
}
