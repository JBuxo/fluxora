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
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import type { HeatmapPoint } from "@/lib/types/api";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getIntensityColor(v: number) {
  if (v > 0.8) return "bg-primary";
  if (v > 0.6) return "bg-primary/70";
  if (v > 0.4) return "bg-primary/50";
  if (v > 0.2) return "bg-primary/30";
  return "bg-muted";
}

interface Props {
  data?: HeatmapPoint[];
}

export default function UsageHeatmap({ data }: Props) {
  const fallback = useMemo(() => {
    return Array.from({ length: 7 * 24 }).map((_, i) => {
      const hour = i % 24;
      const day = Math.floor(i / 24);
      const value =
        Math.sin((hour / 24) * Math.PI * 2) * 0.5 +
        (day >= 5 ? 0.3 : 0.6) +
        Math.sin(i) * 0.1;
      return { hour, day, value, avg_kwh: 0 };
    });
  }, []);

  const points = data && data.length > 0 ? data : fallback;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Heatmap</CardTitle>
        <CardDescription>Average consumption by hour and day</CardDescription>
      </CardHeader>

      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 text-xs">
              {/* header row */}
              <div />
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="text-center text-muted-foreground">
                  {h}
                </div>
              ))}

              {days.map((day, d) => (
                <Fragment key={`${d}`}>
                  <div className="flex items-center text-muted-foreground">
                    {day}
                  </div>

                  {Array.from({ length: 24 }).map((_, h) => {
                    const point = points.find((p) => p.day === d && p.hour === h);

                    return (
                      <Tooltip key={`${d}-${h}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-6 rounded-sm cursor-default ${getIntensityColor(point?.value ?? 0)}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {days[d]} {h}:00 — {point ? `${point.avg_kwh} kWh` : "no data"}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
