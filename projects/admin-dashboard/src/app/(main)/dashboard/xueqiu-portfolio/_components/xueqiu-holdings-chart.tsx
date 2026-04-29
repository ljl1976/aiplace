"use client";

import { PieChart, Pie } from "recharts";
import { ChartPie } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { Holding } from "@/lib/db";

const toNum = (val: number | string): number => typeof val === "string" ? parseFloat(val) : val;

interface XueqiuHoldingsChartProps {
  holdings: Holding[];
}

const SECTOR_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function XueqiuHoldingsChart({ holdings }: XueqiuHoldingsChartProps) {
  // Group by sector
  const sectorGroups = holdings.reduce(
    (acc, h) => {
      const sector = h.sector || "现金";
      if (!acc[sector]) {
        acc[sector] = 0;
      }
      acc[sector] += toNum(h.position_ratio);
      return acc;
    },
    {} as Record<string, number>,
  );

  const chartData = Object.entries(sectorGroups).map(([sector, value]) => ({
    sector,
    value,
    fill: SECTOR_COLORS[Object.keys(sectorGroups).indexOf(sector) % SECTOR_COLORS.length],
  }));

  const chartConfig = {
    sector: { label: "板块" },
    value: { label: "仓位" },
    ...Object.fromEntries(
      chartData.map((item) => [
        item.sector,
        { label: item.sector, color: item.fill },
      ]),
    ),
  } as Record<string, { label: string; color?: string }>;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ChartPie className="size-5 text-violet-500" />
          <CardTitle>持仓分布</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-full sm:flex-1">
          <ChartContainer config={chartConfig} className="w-full aspect-square">
            <PieChart
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="sector"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                cornerRadius={4}
              />
            </PieChart>
          </ChartContainer>
        </div>

        <ul className="flex flex-col gap-2 w-full sm:w-auto">
          {chartData.map((item) => (
            <li key={item.sector} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-full shrink-0" style={{ background: item.fill }} />
                {item.sector}
              </span>
              <span className="text-xs tabular-nums text-right">{toNum(item.value).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}