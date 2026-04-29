"use client";

import * as React from "react";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

type LedgerPriority = "升级" | "指导" | "重新预测" | null;

type LedgerRow = {
  id: number;
  account: string;
  dealId: string;
  stage: string;
  blocker: string;
  owner: string;
  idleDays: number;
  closeVariance: string;
  priority: LedgerPriority;
  nextAction: string;
  riskScore: number;
};

const LEDGER_ROWS: LedgerRow[] = [
  {
    id: 1,
    account: "Oscorp Labs",
    dealId: "OPP-489",
    stage: "法务",
    blocker: "成交日期逾期35天",
    owner: "Leila Zhang",
    idleDays: 36,
    closeVariance: "逾期35天",
    priority: "升级",
    nextAction: "参加下一次客户通话并重新设定成交计划。",
    riskScore: 81,
  },
  {
    id: 2,
    account: "Hooli AI",
    dealId: "OPP-475",
    stage: "资格审核",
    blocker: "成交日期逾期28天",
    owner: "Omar Ali",
    idleDays: 33,
    closeVariance: "逾期28天",
    priority: "指导",
    nextAction: "审查交易策略并解除阶段阻塞。",
    riskScore: 76,
  },
  {
    id: 3,
    account: "Globex Systems",
    dealId: "OPP-447",
    stage: "资格审核",
    blocker: "成交日期逾期37天",
    owner: "Sofia Bautista",
    idleDays: 34,
    closeVariance: "逾期37天",
    priority: "指导",
    nextAction: "审查交易策略并解除阶段阻塞。",
    riskScore: 75,
  },
  {
    id: 4,
    account: "Umbrella Corp",
    dealId: "OPP-459",
    stage: "法务",
    blocker: "成交日期逾期24天",
    owner: "Leila Zhang",
    idleDays: 29,
    closeVariance: "逾期24天",
    priority: "指导",
    nextAction: "审查交易策略并解除阶段阻塞。",
    riskScore: 72,
  },
  {
    id: 5,
    account: "Acme Industries",
    dealId: "OPP-421",
    stage: "谈判",
    blocker: "成交日期逾期32天",
    owner: "Leila Zhang",
    idleDays: 31,
    closeVariance: "逾期32天",
    priority: "指导",
    nextAction: "审查交易策略并解除阶段阻塞。",
    riskScore: 69,
  },
  {
    id: 6,
    account: "Wayne Devices",
    dealId: "OPP-471",
    stage: "提案",
    blocker: "成交日期逾期22天",
    owner: "Sofia Bautista",
    idleDays: 32,
    closeVariance: "逾期22天",
    priority: "重新预测",
    nextAction: "调整预测类别和预期成交时间。",
    riskScore: 56,
  },
  {
    id: 7,
    account: "Aperture Health",
    dealId: "OPP-497",
    stage: "提案",
    blocker: "成交日期逾期20天",
    owner: "Omar Ali",
    idleDays: 30,
    closeVariance: "逾期20天",
    priority: "重新预测",
    nextAction: "调整预测类别和预期成交时间。",
    riskScore: 50,
  },
  {
    id: 8,
    account: "Northwind Labs",
    dealId: "OPP-438",
    stage: "提案",
    blocker: "成交日期逾期14天",
    owner: "Julian Singh",
    idleDays: 23,
    closeVariance: "逾期14天",
    priority: null,
    nextAction: "无需立即干预。",
    riskScore: 42,
  },
  {
    id: 9,
    account: "Stark Logistics",
    dealId: "OPP-463",
    stage: "谈判",
    blocker: "成交日期逾期10天",
    owner: "Julian Singh",
    idleDays: 21,
    closeVariance: "逾期10天",
    priority: null,
    nextAction: "无需立即干预。",
    riskScore: 39,
  },
  {
    id: 10,
    account: "Soylent Foods",
    dealId: "OPP-482",
    stage: "谈判",
    blocker: "成交日期逾期5天",
    owner: "Julian Singh",
    idleDays: 24,
    closeVariance: "逾期5天",
    priority: null,
    nextAction: "无需立即干预。",
    riskScore: 31,
  },
];

const priorityTone: Record<Exclude<LedgerPriority, null>, string> = {
  "升级": "border-destructive/35 bg-destructive/10 text-destructive",
  "指导": "border-primary/35 bg-primary/10 text-primary",
  "重新预测": "border-amber-500/35 bg-amber-500/10 text-amber-700",
};

const ledgerColumns: ColumnDef<LedgerRow>[] = [
  {
    accessorKey: "account",
    header: "账户",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm">{row.original.account}</p>
        <p className="text-muted-foreground text-xs">
          {row.original.dealId} · {row.original.stage}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "blocker",
    header: "阻塞因素",
    cell: ({ row }) => <div className="max-w-44 text-xs">{row.original.blocker}</div>,
  },
  {
    accessorKey: "owner",
    header: "负责人",
    cell: ({ row }) => <span className="text-xs">{row.original.owner}</span>,
  },
  {
    accessorKey: "idleDays",
    header: "闲置天数",
    cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.idleDays}天</span>,
  },
  {
    accessorKey: "closeVariance",
    header: "成交偏差",
    cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.closeVariance}</span>,
  },
  {
    accessorKey: "nextAction",
    header: "下一步行动",
    cell: ({ row }) => (
      <div className="flex max-w-64 flex-col gap-1">
        {row.original.priority ? (
          <Badge variant="outline" className={cn("text-[10px] uppercase", priorityTone[row.original.priority])}>
            {row.original.priority}
          </Badge>
        ) : null}
        <p className="text-xs">{row.original.nextAction}</p>
      </div>
    ),
  },
  {
    accessorKey: "riskScore",
    header: ({ column }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="-mr-2 h-8 px-2 text-xs"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          风险阶梯
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Badge
          variant="outline"
          className={cn(
            "min-w-12 justify-center font-medium tabular-nums",
            row.original.riskScore >= 80 && "border-destructive/35 bg-destructive/10 text-destructive",
            row.original.riskScore >= 65 &&
              row.original.riskScore < 80 &&
              "border-amber-500/35 bg-amber-500/10 text-amber-700",
          )}
        >
          {row.original.riskScore}
        </Badge>
      </div>
    ),
  },
];

export function ActionsRiskLedger() {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "riskScore", desc: true }]);

  const table = useReactTable({
    data: LEDGER_ROWS,
    columns: ledgerColumns,
    getRowId: (row) => String(row.id),
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>收入风险台账</CardTitle>
        <CardDescription>面临压力的账户及其阻塞因素、下一步行动和负责人。</CardDescription>
        <CardAction>
          <Badge variant="outline" className="font-medium tabular-nums">
            {LEDGER_ROWS.length}个账户
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 text-sm sm:grid-cols-4 sm:divide-x sm:divide-border/60">
          <LedgerStat label="关键账户" value="1" detail="风险阶梯≥80（当前窗口）" />
          <LedgerStat label="待升级" value="1" detail="未来7天" />
          <LedgerStat label="闲置中位数" value="31天" detail="当前筛选窗口" />
          <LedgerStat
            label="逾期收入"
            value={formatCurrency(1084000, { noDecimals: true })}
            detail="成交日期已超过"
          />
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function LedgerStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1 px-0 sm:px-3 last:sm:pr-0 first:sm:pl-0">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-base tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{detail}</p>
    </div>
  );
}
