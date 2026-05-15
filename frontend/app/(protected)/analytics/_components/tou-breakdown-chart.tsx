"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HeatmapPoint } from "@/lib/types/api";

// Spanish 2.0TD tariff periods
// P1 (peak):     Mon–Fri 10–14h, 18–22h
// P2 (shoulder): Mon–Fri 08–10h, 14–18h, 22–24h
// P3 (off-peak): Mon–Fri 00–08h + all weekend
function classifyTOU(day: number, hour: number): "P1" | "P2" | "P3" {
  if (day >= 5) return "P3";
  if ((hour >= 10 && hour < 14) || (hour >= 18 && hour < 22)) return "P1";
  if ((hour >= 8 && hour < 10) || (hour >= 14 && hour < 18) || hour >= 22)
    return "P2";
  return "P3";
}

const PERIODS = [
  { key: "P1" as const, label: "P1 — Peak", color: "var(--chart-3)" },
  { key: "P2" as const, label: "P2 — Shoulder", color: "var(--chart-2)" },
  { key: "P3" as const, label: "P3 — Off-peak", color: "var(--chart-1)" },
];

interface Props {
  data: HeatmapPoint[];
}

export function TouBreakdownChart({ data }: Props) {
  const buckets = { P1: 0, P2: 0, P3: 0 };
  for (const pt of data) {
    buckets[classifyTOU(pt.day, pt.hour)] += pt.avg_kwh;
  }
  const total = buckets.P1 + buckets.P2 + buckets.P3 || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time-of-Use Breakdown</CardTitle>
        <CardDescription>
          Consumption split by 2.0TD tariff period — P1 costs most, P3 least
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex h-8 w-full overflow-hidden rounded-lg">
          {PERIODS.map(({ key, label, color }) => {
            const pct = (buckets[key] / total) * 100;
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div
                    className="h-full cursor-default transition-all hover:opacity-80"
                    style={{ width: `${pct.toFixed(2)}%`, background: color }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {label} — {pct.toFixed(1)}%
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          {PERIODS.map(({ key, label, color }) => {
            const pct = (buckets[key] / total) * 100;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: color }}
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <div className="font-semibold">{pct.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">
                  {buckets[key].toFixed(1)} kWh
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
