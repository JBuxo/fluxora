"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { HeatmapPoint } from "@/lib/types/api";

const chartConfig = {
  avg_kwh: { label: "Avg kWh", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface Props {
  data: HeatmapPoint[];
}

export function HourlyProfileChart({ data }: Props) {
  const hourly = Array.from({ length: 24 }, (_, h) => {
    const pts = data.filter((p) => p.hour === h);
    const avg = pts.length ? pts.reduce((s, p) => s + p.avg_kwh, 0) / pts.length : 0;
    return { hour: h, avg_kwh: parseFloat(avg.toFixed(3)) };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Consumption Profile</CardTitle>
        <CardDescription>Average kWh per hour of day across all days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={hourly} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `${v}h`}
              interval={2}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={4} width={40} />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={false}
            />
            <Bar dataKey="avg_kwh" fill="var(--color-avg_kwh)" radius={2} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
