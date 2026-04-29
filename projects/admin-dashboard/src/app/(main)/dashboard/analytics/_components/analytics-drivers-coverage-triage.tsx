import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DriversCoverageTriage() {
  const leverOptions = [
    {
      key: "deal",
      label: "+1笔企业交易",
      value: "+$72,133加权",
      context: "占缺口的32%",
    },
    {
      key: "conversion",
      label: "+5pp转化率",
      value: "+$49,182/月",
      context: "占缺口的22%",
    },
    {
      key: "cycle",
      label: "-4天周期",
      value: "+$90,167/天",
      context: "占缺口的40%",
    },
  ] as const;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>覆盖率分级</CardTitle>
        <CardDescription>本预测周期的决策阶梯</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="destructive" className="rounded-md font-medium">
            有风险
          </Badge>
          <Badge variant="outline" className="font-medium tabular-nums">
            1.9x / 3.0x
          </Badge>
          <Badge variant="outline" className="font-medium tabular-nums">
            缺口 $222,930
          </Badge>
          <Badge variant="outline" className="font-medium tabular-nums">
            4笔交易 • 预计10天
          </Badge>
        </div>

        <p className="text-muted-foreground text-xs">
          覆盖率低于目标。优先考虑合格量和缩短周期时间。
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {leverOptions.map((lever) => (
            <div key={lever.key} className="space-y-1 rounded-md border bg-muted/20 px-2.5 py-2">
              <p className="text-muted-foreground text-xs">{lever.label}</p>
              <p className="font-semibold text-sm tabular-nums">{lever.value}</p>
              <p className="text-muted-foreground text-xs">{lever.context}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              负责人：<span className="font-medium text-foreground">Leila Zhang</span>
            </span>
            <span className="text-muted-foreground">
              重点：<span className="text-foreground">填补缺口的顶级交易</span>
            </span>
            <span className="text-muted-foreground">
              截止：<span className="text-foreground">下次预测通话前</span>
            </span>
          </div>
          <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">
            打开前5笔交易
          </Button>
        </div>

        <div className="space-y-1 rounded-md border border-dashed bg-muted/10 px-3 py-2.5">
          <p className="text-muted-foreground text-xs">
            最快路径：<span className="font-medium text-foreground">-4天周期</span> 恢复40%的缺口。
          </p>
          <p className="text-muted-foreground text-xs">
            优先顺序：<span className="text-foreground">周期时间</span> 优先于新增量。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
