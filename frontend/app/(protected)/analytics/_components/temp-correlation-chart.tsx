"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
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
import type { TempCorrelationPoint } from "@/lib/types/api";

const chartConfig = {
  consumption: { label: "Consumption (kWh)", color: "var(--chart-1)" },
  avg_temp: { label: "Avg Temp (°C)", color: "var(--chart-4)" },
} satisfies ChartConfig;

interface Props {
  data: TempCorrelationPoint[];
}

export function TempCorrelationChart({ data }: Props) {
  const hasTemp = data.some((d) => d.avg_temp !== null);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Temperature vs Consumption</CardTitle>
          <CardDescription>
            Monthly consumption overlaid with average temperature
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          No data yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature vs Consumption</CardTitle>
        <CardDescription>
          {hasTemp
            ? "Monthly consumption (bars) and avg temperature (line) — shows how weather drives usage"
            : "Monthly consumption — weather sync pending"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ComposedChart
            data={data}
            margin={{ left: -10, right: hasTemp ? 24 : 12, top: 4, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              yAxisId="kwh"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={48}
            />
            {hasTemp && (
              <YAxis
                yAxisId="temp"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={40}
                tickFormatter={(v) => `${v}°`}
              />
            )}
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            <Bar
              yAxisId="kwh"
              dataKey="consumption"
              fill="var(--color-consumption)"
              radius={[4, 4, 0, 0]}
            />
            {hasTemp && (
              <Line
                yAxisId="temp"
                dataKey="avg_temp"
                type="natural"
                stroke="var(--color-avg_temp)"
                strokeWidth={2}
                dot={{ fill: "var(--color-avg_temp)" }}
                activeDot={{ r: 6 }}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
