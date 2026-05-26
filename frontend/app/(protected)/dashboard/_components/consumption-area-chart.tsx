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
import type { MonthlyDataPoint } from "@/lib/types/api";

const chartConfig = {
  cost: {
    label: "Cost (€)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface Props {
  data?: MonthlyDataPoint[];
}

export function CumulativeCostAreaChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Energy Cost Trend</CardTitle>
          <CardDescription>
            Monthly cost from consumption records
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No cost data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Cost Trend</CardTitle>
        <CardDescription>Monthly cost from consumption records</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <ChartContainer config={chartConfig}>
          <AreaChart
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
