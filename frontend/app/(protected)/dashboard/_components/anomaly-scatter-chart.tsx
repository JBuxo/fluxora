"use client";

import { Scatter, ScatterChart, XAxis, YAxis, CartesianGrid } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const data = Array.from({ length: 60 }).map((_, i) => {
  const base = 50 + Math.sin(i / 6) * 10;
  const anomaly = i % 19 === 0;

  return {
    x: i,
    value: anomaly ? base * 1.7 : base,
    type: anomaly ? "anomaly" : "normal",
  };
});

const chartConfig = {
  normal: {
    label: "Normal",
    color: "var(--chart-1)",
  },
  anomaly: {
    label: "Anomaly",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function AnomalyScatterChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomalies</CardTitle>
        <CardDescription>Historical consumption outliers</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="x"
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `T${v}`}
            />
            <YAxis
              dataKey="value"
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelKey="x"
                  nameKey="type"
                />
              }
            />

            <ChartLegend content={<ChartLegendContent />} />

            <Scatter
              name="normal"
              data={data.filter((d) => d.type === "normal")}
              fill="var(--color-normal)"
            />

            <Scatter
              name="anomaly"
              data={data.filter((d) => d.type === "anomaly")}
              fill="var(--color-anomaly)"
            />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
