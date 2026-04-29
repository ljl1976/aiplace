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
import type { Holding } from "@/lib/db";

const toNum = (val: number | string): number => typeof val === "string" ? parseFloat(val) : val;

interface XueqiuHoldingsTableProps {
  holdings: Holding[];
}

export function XueqiuHoldingsTable({ holdings }: XueqiuHoldingsTableProps) {
  const sectorGroups = holdings.reduce(
    (acc, h) => {
      const sector = h.sector || "现金";
      if (!acc[sector]) {
        acc[sector] = { ratio: h.sector_ratio, stocks: [] };
      }
      acc[sector].stocks.push(h);
      return acc;
    },
    {} as Record<string, { ratio: number; stocks: Holding[] }>,
  );

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>持仓明细</CardTitle>
        <CardDescription>最新快照持仓分布</CardDescription>
      </CardHeader>
      <CardContent>
        {holdings.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(sectorGroups).map(([sector, { ratio, stocks }]) => (
              <div key={sector} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sector}</span>
                    <Badge variant="secondary">{toNum(ratio).toFixed(2)}%</Badge>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>股票名称</TableHead>
                      <TableHead>股票代码</TableHead>
                      <TableHead className="text-right">日涨跌</TableHead>
                      <TableHead className="text-right">仓位占比</TableHead>
                      <TableHead className="text-right">现价</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((stock, idx) => (
                      <TableRow key={`${stock.snapshot_id}-${stock.id ?? idx}`}>
                        <TableCell className="font-medium">{stock.stock_name || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{stock.stock_code || "-"}</TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${
                            toNum(stock.daily_change) > 0
                              ? "text-red-500"
                              : toNum(stock.daily_change) < 0
                                ? "text-green-500"
                                : ""
                          }`}
                        >
                          {stock.daily_change != null && stock.daily_change !== 0
                            ? `${toNum(stock.daily_change) > 0 ? "+" : ""}${toNum(stock.daily_change).toFixed(2)}%`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {toNum(stock.position_ratio).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {toNum(stock.price) > 0 ? `¥${toNum(stock.price).toFixed(2)}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">暂无持仓数据</div>
        )}
      </CardContent>
    </Card>
  );
}
