"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Holding } from "@/lib/db";

const toNum = (val: number | string): number => typeof val === "string" ? parseFloat(val) : val;

interface XueqiuHoldingsListProps {
  holdings: Holding[];
}

const SECTOR_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

export function XueqiuHoldingsList({ holdings }: XueqiuHoldingsListProps) {
  // Group by sector
  const sectorGroups = holdings.reduce(
    (acc, h) => {
      const sector = h.sector || "现金";
      if (!acc[sector]) {
        acc[sector] = [];
      }
      acc[sector].push(h);
      return acc;
    },
    {} as Record<string, Holding[]>,
  );

  const totalPositionRatio = holdings.reduce((sum, h) => sum + toNum(h.position_ratio), 0);

  // Flatten with sector info for display, sorted by position_ratio descending
  const flatHoldings = Object.entries(sectorGroups)
    .flatMap(([sector, stocks]) => stocks.map((stock) => ({ ...stock, sector })))
    .sort((a, b) => b.position_ratio - a.position_ratio);

  return (
    <Card>
      <CardHeader>
        <CardTitle>持仓股票</CardTitle>
        <CardDescription>当前持仓明细</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="font-medium text-2xl">{totalPositionRatio.toFixed(1)}%</div>
          <div className="flex h-6 w-full overflow-hidden rounded-md">
            {flatHoldings.map((stock) => {
              const width = (stock.position_ratio / totalPositionRatio) * 100;
              const colorIndex = Object.keys(sectorGroups).indexOf(stock.sector) % SECTOR_COLORS.length;

              return (
                <div
                  key={`${stock.snapshot_id}-${stock.id}`}
                  className="h-full shrink-0 border-background border-l first:border-l-0"
                  style={{
                    width: `${width}%`,
                    background: SECTOR_COLORS[colorIndex],
                  }}
                  title={`${stock.stock_name}: ${stock.position_ratio.toFixed(2)}%`}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          {flatHoldings.map((stock) => {
            const colorIndex = Object.keys(sectorGroups).indexOf(stock.sector) % SECTOR_COLORS.length;

            return (
              <div key={`${stock.snapshot_id}-${stock.id}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-sm"
                    style={{
                      background: SECTOR_COLORS[colorIndex],
                    }}
                  />
                  <span className="text-muted-foreground text-sm">{stock.stock_name}</span>
                  <span className="text-muted-foreground text-xs">({stock.stock_code})</span>
                </div>
                <span className="font-medium text-sm tabular-nums">{stock.position_ratio.toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}