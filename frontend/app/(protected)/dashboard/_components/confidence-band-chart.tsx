"use client";

import {
  Area,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

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
  type ChartConfig,
} from "@/components/ui/chart";

const data = Array.from({ length: 30 }).map((_, i) => {
  const base = 60 + Math.sin(i / 4) * 8;

  return {
    day: i,
    actual: parseFloat((base + (Math.random() - 0.5) * 5).toFixed(1)),
    range: [
      parseFloat((base - 15).toFixed(1)),
      parseFloat((base + 15).toFixed(1)),
    ] as [number, number],
  };
});

const config = {
  actual: { label: "Actual", color: "var(--chart-1)" },
  range: { label: "Expected range", color: "var(--chart-1)" },
} satisfies ChartConfig;

function BandTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const actual = payload.find((p) => p.dataKey === "actual");
  const range = payload.find((p) => p.dataKey === "range");
  const [lower, upper] = (range?.value as [number, number]) ?? [];

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-foreground">Day {label}</p>
      {actual && (
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: "var(--color-actual)" }}
          />
          <span className="text-muted-foreground">Actual</span>
          <span className="ml-auto pl-4 font-medium tabular-nums text-foreground">
            {Number(actual.value).toFixed(1)}
          </span>
        </div>
      )}
      {range && (
        <div className="mt-1 flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-sm opacity-40"
            style={{ backgroundColor: "var(--color-range)" }}
          />
          <span className="text-muted-foreground">Expected range</span>
          <span className="ml-auto pl-4 font-medium tabular-nums text-foreground">
            {lower} - {upper}
          </span>
        </div>
      )}
    </div>
  );
}

export function ConfidenceBandChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expected vs Actual</CardTitle>
        <CardDescription>
          Confidence band based on historical variance
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={config} className="h-75 w-full">
          <ComposedChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="day"
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => `D${v}`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={["auto", "auto"]}
            />

            <ChartTooltip content={<BandTooltip />} />

            <ChartLegend content={<ChartLegendContent />} />

            {/* Range band — dataKey as [lower, upper] tuple renders a filled area */}
            <Area
              dataKey="range"
              fill="var(--color-range)"
              fillOpacity={0.12}
              stroke="var(--color-range)"
              strokeOpacity={0.3}
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              legendType="square"
            />

            <Line
              dataKey="actual"
              stroke="var(--color-actual)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
