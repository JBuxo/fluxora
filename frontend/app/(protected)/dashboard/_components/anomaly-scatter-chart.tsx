"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import type { DotProps } from "recharts";

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

type AnomalyDotProps = DotProps & {
  payload?: DataPoint;
};

type DataPoint = {
  x: number;
  expected: number;
  actual: number;
  anomaly: boolean;
};

const rawData = Array.from({ length: 60 }).map((_, i) => {
  const base = 50 + Math.sin(i / 6) * 10;
  const anomaly = i % 19 === 0;

  return {
    x: i,
    expected: base,
    actual: anomaly ? base * 1.7 : base,
    anomaly,
  };
});

const chartConfig = {
  expected: {
    label: "Expected",
    color: "var(--chart-1)",
  },
  actual: {
    label: "Actual",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function AnomalyDot({ cx, cy, payload }: AnomalyDotProps) {
  if (!cx || !cy) return null;
  if (!payload?.anomaly) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--chart-3)"
      stroke="white"
      strokeWidth={2}
    />
  );
}

export function AnomalyScatterChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomalies</CardTitle>
        <CardDescription>Historical consumption monitoring</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <LineChart
            data={rawData}
            margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="x"
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `T${v}`}
            />

            <YAxis tickLine={false} axisLine={false} tickMargin={8} />

            <ChartTooltip
              content={<ChartTooltipContent className="min-w-40 " />}
              cursor={false}
              defaultIndex={1}
              payloadUniqBy
            />

            <ChartLegend content={<ChartLegendContent />} />

            {/* Expected */}
            <Line
              dataKey="expected"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />

            {/* Actual */}
            <Line
              dataKey="actual"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
            />

            {/* Anomaly markers (on actual only) */}
            <Line
              dataKey="actual"
              stroke="transparent"
              dot={<AnomalyDot />}
              activeDot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
