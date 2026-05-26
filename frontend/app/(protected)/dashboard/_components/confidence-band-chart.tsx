"use client";

import {
  Area,
  ComposedChart,
  Line,
  CartesianGrid,
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DailyForecast } from "@/lib/types/api";

const config = {
  predicted: { label: "Forecast", color: "var(--chart-3)" },
  range: { label: "80% confidence", color: "var(--chart-1)" },
} satisfies ChartConfig;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BandTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predicted = payload.find((p: any) => p.dataKey === "predicted");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const range = payload.find((p: any) => p.dataKey === "range");
  const [lower, upper] = (range?.value as [number, number]) ?? [];

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      {predicted && (
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: "var(--color-predicted)" }}
          />
          <span className="text-muted-foreground">Forecast</span>
          <span className="ml-auto pl-4 font-medium tabular-nums text-foreground">
            {Number(predicted.value).toFixed(2)} kWh
          </span>
        </div>
      )}
      {range && lower != null && (
        <div className="mt-1 flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-sm opacity-40"
            style={{ backgroundColor: "var(--color-range)" }}
          />
          <span className="text-muted-foreground">Range</span>
          <span className="ml-auto pl-4 font-medium tabular-nums text-foreground">
            {lower.toFixed(1)} – {upper.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

interface Props {
  daily: DailyForecast[];
}

export function ConfidenceBandChart({ daily }: Props) {
  const chartData = daily.map((d) => ({
    date: d.date.slice(5),
    predicted: parseFloat(d.predicted_kwh.toFixed(2)),
    range: [
      parseFloat(d.lower_kwh.toFixed(2)),
      parseFloat(d.upper_kwh.toFixed(2)),
    ] as [number, number],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Consumption Forecast</CardTitle>
        <CardDescription>Forecast with confidence band</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={config} className="h-75 w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={6}
              tickFormatter={(v) => {
                const [month, day] = v.split("-");
                return `${new Date(2000, parseInt(month) - 1).toLocaleString("en", { month: "short" })} ${parseInt(day)}`;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${v}`}
            />

            <ChartTooltip content={<BandTooltip />} />
            <ChartLegend content={<ChartLegendContent />} />

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
              dataKey="predicted"
              stroke="var(--color-predicted)"
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
