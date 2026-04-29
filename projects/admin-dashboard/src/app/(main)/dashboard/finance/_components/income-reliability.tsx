"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

export function IncomeReliability() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>收入稳定性</CardTitle>
        <CardDescription>近期收入的一致性分析。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <div className="space-y-0.5">
          <p className="font-medium text-xl">高可靠性</p>
          <p className="text-muted-foreground text-xs">基于最近6个月的收入</p>
        </div>
        <Separator />
        <div className="flex justify-between">
          <div className="space-y-0.5">
            <p className="font-medium text-lg">固定收入</p>
            <p className="text-muted-foreground text-xs">定期 · 可预测</p>
          </div>
          <p className="font-medium text-lg">{formatCurrency(90000, { noDecimals: true })}</p>
        </div>
        <Separator />
        <div className="flex justify-between">
          <div className="space-y-0.5">
            <p className="font-medium text-lg">变动收入</p>
            <p className="text-muted-foreground text-xs">波动来源</p>
          </div>
          <p className="font-medium text-lg">{formatCurrency(46500, { noDecimals: true })}</p>
        </div>
        <Separator />
        <p className="text-muted-foreground text-xs">
          一致性趋势：<span className="font-medium text-primary">稳定</span>
        </p>
      </CardContent>
    </Card>
  );
}
