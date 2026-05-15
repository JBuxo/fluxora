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

export const description =
  "Energy consumption trend chart with historical monthly data";

const chartData = [
  { month: "January", consumption: 186, previous: 165 },
  { month: "February", consumption: 305, previous: 260 },
  { month: "March", consumption: 237, previous: 220 },
  { month: "April", consumption: 173, previous: 190 },
  { month: "May", consumption: 209, previous: 200 },
  { month: "June", consumption: 214, previous: 195 },
];

const chartConfig = {
  consumption: {
    label: "Consumption",
    color: "var(--chart-1)",
  },
  previous: {
    label: "Previous Period",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ConsumptionTrendLineChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Consumption Trend</CardTitle>
        <CardDescription>Monthly usage comparison</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
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

            {/* COMPARISON SERIES (previous period) */}
            <Line
              dataKey="previous"
              type="natural"
              stroke="var(--color-previous)"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Consumption trend stable with slight increase{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Based on uploaded historical distributor reports
        </div>
      </CardFooter>
    </Card>
  );
}
