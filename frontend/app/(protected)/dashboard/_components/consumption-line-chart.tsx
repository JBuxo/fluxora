"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  consumption: {
    label: "Consumption (kWh)",
    color: "var(--chart-1)",
  },
  previous: {
    label: "Previous Month",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface Props {
  data?: MonthlyDataPoint[];
}

export function ConsumptionTrendLineChart({ data }: Props) {
  const hasPreviousData =
    (data ?? []).filter((d) => d.previous !== null).length >= 2;

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Energy Consumption Trend</CardTitle>
          <CardDescription>Monthly usage comparison</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No consumption data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Consumption Trend</CardTitle>
        <CardDescription>Monthly usage comparison</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              left: 32,
              right: 32,
            }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent indicator="line" className="min-w-40 " />
              }
            />

            {/* MAIN SERIES */}
            <Line
              dataKey="consumption"
              type="natural"
              stroke="var(--color-consumption)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-consumption)",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>

            {/* COMPARISON SERIES (previous month) */}
            {hasPreviousData && (
              <Line
                dataKey="previous"
                type="natural"
                stroke="var(--color-previous)"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Monthly consumption vs previous month{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          From Datadis consumption records
        </div>
      </CardFooter>
    </Card>
  );
}
