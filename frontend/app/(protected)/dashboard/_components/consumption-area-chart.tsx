"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
  "Cumulative energy cost over time based on historical consumption";

const chartData = [
  { month: "January", cost: 186 },
  { month: "February", cost: 305 },
  { month: "March", cost: 237 },
  { month: "April", cost: 173 },
  { month: "May", cost: 209 },
  { month: "June", cost: 214 },
];

const chartConfig = {
  cost: {
    label: "Cost",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function CumulativeCostAreaChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Cost Trend</CardTitle>
        <CardDescription>
          Cumulative cost based on historical reports
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
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
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />

            <Area
              dataKey="cost"
              type="natural"
              fill="var(--color-cost)"
              fillOpacity={0.4}
              stroke="var(--color-cost)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Cost increasing steadily <TrendingUp className="h-4 w-4" />
            </div>

            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Based on uploaded historical consumption data
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
