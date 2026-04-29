import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Rebalance } from "@/lib/db";

const toNum = (val: number | string): number => typeof val === "string" ? parseFloat(val) : val;

interface XueqiuRebalancesTableProps {
  rebalances: Rebalance[];
}

export function XueqiuRebalancesTable({ rebalances }: XueqiuRebalancesTableProps) {
  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="size-5 text-amber-500" />
          <CardTitle>调仓历史</CardTitle>
        </div>
        <CardDescription>最近10条调仓记录</CardDescription>
      </CardHeader>
      <CardContent className="h-full overflow-auto">
        {rebalances.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>股票</TableHead>
                <TableHead className="text-right">调仓</TableHead>
                <TableHead className="text-right">价格</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rebalances.map((r, idx) => (
                <TableRow key={`${r.portfolio_id}-${r.rebalance_time}-${r.stock_code}-${idx}`}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {r.rebalance_time.substring(0, 10)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{r.stock_name}</span>
                      <span className="text-muted-foreground text-xs">{r.stock_code}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      {toNum(r.to_ratio) === 0 ? (
                        <Badge variant="destructive" className="text-xs h-5">
                          清仓
                        </Badge>
                      ) : toNum(r.is_dividend) === 1 ? (
                        <Badge variant="secondary" className="text-xs h-5">
                          分红
                        </Badge>
                      ) : (
                        <span className="text-sm tabular-nums">
                          {toNum(r.from_ratio).toFixed(1)}% → {toNum(r.to_ratio).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {toNum(r.price) > 0 ? `¥${toNum(r.price).toFixed(2)}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-muted-foreground py-8 text-center">暂无调仓记录</div>
        )}
      </CardContent>
    </Card>
  );
}
