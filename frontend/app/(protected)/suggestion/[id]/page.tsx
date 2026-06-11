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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { useRecommendations } from "@/hooks/use-recommendations";

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

// Human-readable labels for known supporting_data keys
const DATA_LABELS: Record<string, string> = {
  peak_pct: "Peak-hour share",
  p1_rate_eur_kwh: "P1 rate (€/kWh)",
  p2_rate_eur_kwh: "P2 rate (€/kWh)",
  rate_delta: "Rate difference (€/kWh)",
  forecast_kwh_30d: "Forecast — next 30 days (kWh)",
  actual_kwh_30d: "Actual — last 30 days (kWh)",
  delta_pct: "Δ vs last month",
  anomaly_count: "Anomaly count",
  anomaly_dates: "Anomaly dates",
  max_z_score: "Worst spike (z-score)",
  p1_kwh_monthly: "P1 usage/month (kWh)",
  p2_kwh_monthly: "P2 usage/month (kWh)",
  current_monthly_cost_eur: "Current monthly energy cost (€)",
  high_draw_appliances: "High-draw appliances",
  estimated_shiftable_kwh_month: "Shiftable usage/month (kWh)",
  days_remaining: "Days left this month",
  remaining_forecast_kwh: "Forecast remaining (kWh)",
  projected_total_eur: "Projected bill total (€)",
  temp_consumption_correlation: "Temp–consumption correlation (r)",
  data_points: "Data points used",
};

function formatValue(key: string, value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number") {
    if (key.includes("pct") || key === "delta_pct") return `${(value * 100).toFixed(1)}%`;
    if (key.includes("eur") || key.includes("cost") || key === "rate_delta")
      return `€${value.toFixed(3)}`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(value);
}

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

  const dataEntries = Object.entries(rec.supporting_data ?? {});

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cfg.badge}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
          {rec.confidence === "high" && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-border">
              High confidence
            </Badge>
          )}
          {rec.confidence === "medium" && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-border">
              Medium confidence
            </Badge>
          )}
        </div>

        <h1 className="text-2xl font-semibold leading-snug">{rec.title}</h1>
        <p className="text-muted-foreground leading-relaxed max-w-prose">{rec.detail}</p>

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

      {/* Supporting data */}
      {dataEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supporting Data</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {dataEntries.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-muted-foreground shrink-0">
                    {DATA_LABELS[key] ?? key.replace(/_/g, " ")}
                  </dt>
                  <dd className="text-sm font-mono font-medium text-right">
                    {formatValue(key, value)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
