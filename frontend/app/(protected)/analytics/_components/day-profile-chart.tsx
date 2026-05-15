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

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const chartConfig = {
  total_kwh: { label: "Avg daily kWh", color: "var(--chart-2)" },
} satisfies ChartConfig;

interface Props {
  data: HeatmapPoint[];
}

export function DayProfileChart({ data }: Props) {
  const daily = Array.from({ length: 7 }, (_, d) => {
    const pts = data.filter((p) => p.day === d);
    const total = pts.reduce((s, p) => s + p.avg_kwh, 0);
    return { day: DAY_NAMES[d], total_kwh: parseFloat(total.toFixed(3)) };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Day-of-Week Profile</CardTitle>
        <CardDescription>Total average consumption per day of week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={daily} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={4} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            <Bar dataKey="total_kwh" fill="var(--color-total_kwh)" radius={2} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
