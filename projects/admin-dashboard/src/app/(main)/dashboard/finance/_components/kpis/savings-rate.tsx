"use client";

import { HandCoins } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SavingsRate() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-content-center rounded-sm bg-muted">
              <HandCoins className="size-5" />
            </span>
            储蓄率
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <p className="font-medium text-xl tabular-nums">32%</p>
            <span className="text-xs">+3.5% 环比</span>
          </div>
          <p className="text-muted-foreground text-xs">本月 · 扣除支出后</p>
        </div>

        <Separator />

        <p className="text-muted-foreground text-xs">高于您的平均水平</p>
      </CardContent>
    </Card>
  );
}
