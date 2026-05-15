"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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
import type { MonthlyDataPoint } from "@/lib/types/api";

const chartConfig = {
  cost_per_kwh: { label: "€/kWh", color: "var(--chart-2)" },
} satisfies ChartConfig;

interface Props {
  data: MonthlyDataPoint[];
}

export function CostEfficiencyChart({ data }: Props) {
  const chartData = data
    .filter((m) => m.consumption > 0)
    .map((m) => ({
      month: m.month,
      cost_per_kwh: parseFloat((m.cost / m.consumption).toFixed(4)),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Efficiency</CardTitle>
        <CardDescription>Average cost per kWh by month (€/kWh)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart data={chartData} margin={{ left: -10, right: 12, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={48}
              tickFormatter={(v) => `€${v}`}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
            <Line
              dataKey="cost_per_kwh"
              type="natural"
              stroke="var(--color-cost_per_kwh)"
              strokeWidth={2}
              dot={{ fill: "var(--color-cost_per_kwh)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
