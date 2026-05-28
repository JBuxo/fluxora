"use client";

import {
  Area,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
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
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AnomalyPoint } from "@/lib/types/api";

type DataPoint = {
  date: string;
  range: [number, number];
  actual: number;
  is_anomaly: boolean;
};

type AnomalyDotProps = DotProps & { payload?: DataPoint };

const chartConfig = {
  range: { label: "Expected range", color: "var(--chart-1)" },
  actual: { label: "Actual", color: "var(--chart-3)" },
} satisfies ChartConfig;

function ActualDot({ cx, cy, payload }: AnomalyDotProps) {
  if (!cx || !cy) return null;
  if (payload?.is_anomaly) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--destructive)"
        stroke="white"
        strokeWidth={2}
      />
    );
  }
  return (
    <circle cx={cx} cy={cy} r={2} fill="var(--color-actual)" opacity={0.4} />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AnomalyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = payload.find((p: any) => p.dataKey === "actual");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const range = payload.find((p: any) => p.dataKey === "range");
  const [lower, upper] = (range?.value as [number, number]) ?? [];
  const isAnomaly = actual?.payload?.is_anomaly;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      {range && lower != null && (
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-sm opacity-40"
            style={{ backgroundColor: "var(--color-range)" }}
          />
          <span className="text-muted-foreground">Expected</span>
          <span className="ml-auto pl-4 font-medium tabular-nums">
            {lower.toFixed(1)} – {upper.toFixed(1)} kWh
          </span>
        </div>
      )}
      {actual && (
        <div className="flex items-center gap-2 mt-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: isAnomaly
                ? "var(--destructive)"
                : "var(--color-actual)",
            }}
          />
          <span className="text-muted-foreground">Actual</span>
          <span className="ml-auto pl-4 font-medium tabular-nums">
            {Number(actual.value).toFixed(2)} kWh
          </span>
        </div>
      )}
      {isAnomaly && (
        <p className="mt-1.5 text-destructive font-medium">
          Anomaly spike detected
        </p>
      )}
    </div>
  );
}

interface Props {
  data: AnomalyPoint[];
  allData?: AnomalyPoint[];
}

export function AnomalyScatterChart({ data, allData }: Props) {
  const chartData: DataPoint[] = (allData ?? data).map((d) => ({
    date: d.date.slice(5),
    range: [
      parseFloat(d.lower_kwh.toFixed(2)),
      parseFloat(d.upper_kwh.toFixed(2)),
    ] as [number, number],
    actual: parseFloat(d.actual_kwh.toFixed(2)),
    is_anomaly: d.is_anomaly,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anomaly Detection</CardTitle>
          <CardDescription>
            Actual vs expected daily consumption
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Detection</CardTitle>
        <CardDescription>
          Dots outside the band exceed 2σ from expected
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={Math.floor(chartData.length / 6)}
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
            />

            <ChartTooltip content={<AnomalyTooltip />} cursor={false} />

            <Area
              dataKey="range"
              fill="var(--color-range)"
              fillOpacity={0.25}
              stroke="var(--color-range)"
              strokeOpacity={0.3}
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              legendType="none"
            />

            <Line
              dataKey="actual"
              stroke="var(--color-actual)"
              strokeWidth={1.5}
              dot={<ActualDot />}
              activeDot={false}
            />
          </ComposedChart>
        </ChartContainer>

        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-4 rounded-sm"
              style={{
                backgroundColor: "var(--chart-1)",
                opacity: 0.25,
                border: "1px dashed var(--chart-1)",
              }}
            />
            Expected range
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full opacity-40"
              style={{ backgroundColor: "var(--chart-3)" }}
            />
            Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--destructive)" }}
            />
            Anomaly spike
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
