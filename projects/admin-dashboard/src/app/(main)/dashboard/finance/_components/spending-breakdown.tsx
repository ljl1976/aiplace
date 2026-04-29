"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const expenses = [
  {
    key: "housing",
    label: "住房",
    amount: 1650,
  },
  {
    key: "utilities",
    label: "水电燃气",
    amount: 420,
  },
  {
    key: "groceries",
    label: "食品杂货",
    amount: 560,
  },
  {
    key: "transportation",
    label: "交通",
    amount: 740,
  },
  {
    key: "subscriptions",
    label: "订阅服务",
    amount: 260,
  },
  {
    key: "healthcare",
    label: "医疗保健",
    amount: 390,
  },
  {
    key: "other",
    label: "其他",
    amount: 980,
  },
];

export function SpendingBreakdown() {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>支出分类</CardTitle>
        <CardDescription>按类别显示的支出分布。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="font-medium text-2xl">{formatCurrency(total, { noDecimals: true })}</div>
          <div className="flex h-6 w-full overflow-hidden rounded-md">
            {expenses.map((item, index) => {
              const width = (item.amount / total) * 100;
              const alpha = Math.max(0.35, 1 - index * 0.08);

              return (
                <div
                  key={item.key}
                  className="h-full shrink-0 border-background border-l first:border-l-0"
                  style={{
                    width: `${width}%`,
                    background: `color-mix(in oklch, var(--primary) ${alpha * 100}%, transparent)`,
                  }}
                  title={`${item.label}: ${formatCurrency(item.amount)}`}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          {expenses.map((item, index) => {
            const pct = Math.round((item.amount / total) * 100);
            const alpha = Math.max(0.35, 1 - index * 0.08);

            return (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-sm"
                    style={{
                      background: `color-mix(in oklch, var(--primary) ${alpha * 100}%, transparent)`,
                    }}
                  />
                  <span className="text-muted-foreground text-sm">{item.label}</span>
                </div>

                <span className="font-medium text-sm tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
