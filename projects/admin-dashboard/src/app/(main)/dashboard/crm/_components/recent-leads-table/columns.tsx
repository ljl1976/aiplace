"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { RecentLeadRow } from "./schema";

export const recentLeadsColumns: ColumnDef<RecentLeadRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="全选"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="选择行"
        />
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "编号",
    cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "姓名",
    cell: ({ row }) => row.original.name,
    enableHiding: false,
  },
  {
    accessorKey: "company",
    header: "公司",
    cell: ({ row }) => row.original.company,
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
  },
  {
    accessorKey: "source",
    header: "来源",
    cell: ({ row }) => <Badge variant="outline">{row.original.source}</Badge>,
  },
  {
    accessorKey: "lastActivity",
    header: "最后活动",
    cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.lastActivity}</span>,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex size-8 text-muted-foreground">
            <EllipsisVertical />
            <span className="sr-only">打开菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuGroup>
            <DropdownMenuItem>查看</DropdownMenuItem>
            <DropdownMenuItem>分配</DropdownMenuItem>
            <DropdownMenuItem>归档</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive">删除</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
  },
];
