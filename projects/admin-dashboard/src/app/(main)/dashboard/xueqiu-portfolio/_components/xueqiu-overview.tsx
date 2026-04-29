"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, ChartPie, Users, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LatestRebalance, Portfolio } from "@/lib/db";

interface PortfolioMetricsData {
  daily_return: number | string | null;
  monthly_return: number | string | null;
  total_return: number | string | null;
  rank_percent: number | string | null;
  cash_ratio: number | string | null;
  score: number | string | null;
  observations: string | null;
}

interface XueqiuOverviewProps {
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  latestRebalance?: LatestRebalance;
  metrics: PortfolioMetricsData | null;
}

export function XueqiuOverview({ portfolios, selectedPortfolioId, latestRebalance, metrics }: XueqiuOverviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId) ?? portfolios[0];

  const handlePortfolioChange = (newId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("portfolio", newId);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-500" />
            <CardTitle>雪球组合</CardTitle>
          </div>
          <CardDescription className="flex items-center gap-1">
            <Users className="size-3 mr-1" />
            主理人：{selectedPortfolio?.creator} · 创建于 {selectedPortfolio?.create_date}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="size-3" />
              {selectedPortfolio?.followers} 关注
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2">{selectedPortfolio?.description}</p>
          {latestRebalance && (
            <div className="mt-3 rounded-md border bg-muted/20 px-3 py-2">
              <p className="text-muted-foreground text-xs">最新调仓</p>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{latestRebalance.stock_name}</span>
                  <span className="text-muted-foreground text-xs">{latestRebalance.stock_code}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm tabular-nums">
                    {latestRebalance.from_ratio != null ? latestRebalance.from_ratio.toFixed(1) : '0.0'}% → {latestRebalance.to_ratio.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {latestRebalance.rebalance_time.substring(0, 16)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-full shadow-xs lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ChartPie className="size-5 text-blue-500" />
            <CardTitle>关键指标</CardTitle>
          </div>
          <CardDescription>最新快照数据</CardDescription>
        </CardHeader>
        <CardContent className="flex h-full flex-col gap-4">
          <PortfolioMetrics metrics={metrics} />
        </CardContent>
      </Card>
    </div>
  );
}

function PortfolioMetrics({ metrics }: { metrics: PortfolioMetricsData | null }) {
  if (!metrics) {
    return <div className="text-muted-foreground text-sm">暂无数据</div>;
  }

  const formatPercent = (val: number | string | null, showSign = false) => {
    if (val == null || val === "") return "-";
    const numVal = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(numVal)) return "-";
    return `${showSign && numVal > 0 ? "+" : ""}${numVal.toFixed(2)}%`;
  };

  const items = [
    { label: "日收益率", value: formatPercent(metrics.daily_return, true) },
    { label: "月收益率", value: formatPercent(metrics.monthly_return, true) },
    { label: "总收益率", value: formatPercent(metrics.total_return, true) },
    { label: "跑赢百分比", value: formatPercent(metrics.rank_percent) },
    { label: "现金比例", value: formatPercent(metrics.cash_ratio) },
    { label: "业绩评分", value: metrics.score != null ? `${metrics.score}` : "-" },
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <MetricChip key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
      {metrics.observations && (
        <div className="space-y-3 rounded-md border bg-muted/20 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">观察要点</p>
          </div>
          <p className="whitespace-pre-line text-xs leading-relaxed">{metrics.observations}</p>
        </div>
      )}
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-2.5 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-base tabular-nums">{value}</p>
    </div>
  );
}
