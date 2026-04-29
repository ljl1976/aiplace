import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const NEXT_INTERVENTIONS = [
  {
    dealId: "OPP-489",
    priority: "升级",
    owner: "Leila Zhang",
    risk: 81,
    recommendation: "参加下一次客户通话并重新设定成交计划。",
  },
  {
    dealId: "OPP-475",
    priority: "指导",
    owner: "Omar Ali",
    risk: 76,
    recommendation: "审查交易策略并解除阶段阻塞。",
  },
  {
    dealId: "OPP-447",
    priority: "指导",
    owner: "Sofia Bautista",
    risk: 75,
    recommendation: "审查交易策略并解除阶段阻塞。",
  },
] as const;

export function ActionsManagerQueue() {
  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>管理者行动队列</CardTitle>
        <CardDescription>在提交通话前进行升级、指导和重新预测</CardDescription>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex h-full flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="可执行交易" value="7" />
            <StatCard label="在途收入" value={formatCurrency(811000, { noDecimals: true })} mono />
            <StatCard label="涉及负责人" value="3" />
            <StatCard label="风险中位数" value="72" mono />
          </div>

          <div className="space-y-2 rounded-md border bg-muted/20 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">干预组合</p>
              <Badge variant="outline" className="h-5 px-2 text-[11px] tabular-nums">
                升级 {formatCurrency(174000, { noDecimals: true })}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-md border bg-background/70 px-2.5 py-1.5">
                <span className="text-xs">升级</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  1笔交易 · 14% · {formatCurrency(174000, { noDecimals: true })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-background/70 px-2.5 py-1.5">
                <span className="text-xs">指导</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  4笔交易 · 57% · {formatCurrency(478000, { noDecimals: true })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-background/70 px-2.5 py-1.5">
                <span className="text-xs">重新预测</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  2笔交易 · 29% · {formatCurrency(159000, { noDecimals: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-md border bg-muted/20 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">管理者重点</p>
              <span className="text-muted-foreground text-xs tabular-nums">本预测周期</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-2.5 py-1.5">
                <span>指导队列</span>
                <span className="text-muted-foreground tabular-nums">
                  4笔交易 · {formatCurrency(478000, { noDecimals: true })}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-2.5 py-1.5">
                <span>主要负责人</span>
                <span className="text-muted-foreground tabular-nums">Leila Zhang · 3笔交易</span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-2.5 py-1.5">
                <span>停滞管道</span>
                <span className="text-muted-foreground tabular-nums">
                  8笔交易 · {formatCurrency(1151000, { noDecimals: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-muted-foreground text-xs">下一步干预</p>

            {NEXT_INTERVENTIONS.map((item) => (
              <div key={`${item.priority}-${item.dealId}`} className="space-y-1 rounded-md border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{item.dealId}</span>
                  <Badge variant="outline" className="h-5 px-2 text-[11px]">
                    {item.priority}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {item.owner} · 风险{item.risk}
                </p>
                <p className="text-xs">{item.recommendation}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2">
            <span className="text-muted-foreground text-xs">无需行动监控</span>
            <span className="font-medium text-xs tabular-nums">3笔交易</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border bg-muted/20 px-2.5 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={mono ? "font-semibold text-base tabular-nums" : "font-semibold text-base"}>{value}</p>
    </div>
  );
}
