"use client";

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { WebService } from "../../_lib/types";

export function WebServiceTable() {
  const [webServices, setWebServices] = useState<WebService[]>([]);
  const [loading, setLoading] = useState(true);

  const table = useReactTable({
    data: webServices,
    columns: webServiceColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    fetchWebServices();
    const interval = setInterval(fetchWebServices, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  async function fetchWebServices() {
    try {
      const response = await fetch("/api/service-management?type=web-services");
      if (response.ok) {
        const data = await response.json();
        setWebServices(data);
      }
    } catch (error) {
      console.error("Failed to fetch web services:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg @2xs/main:text-xl">Web服务</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWebServices}
            disabled={loading}
          >
            <RefreshCw className={`mr-1 h-3 w-3 @2xs/main:mr-2 @2xs/main:h-4 @2xs/main:w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden @xs/main:inline">刷新</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            加载中...
          </div>
        ) : webServices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            没有找到运行中的Web服务
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs @2xs/main:text-sm">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-xs @2xs/main:text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={webServiceColumns.length}
                      className="h-24 text-center"
                    >
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const webServiceColumns = [
  {
    accessorKey: "name",
    header: "服务名称",
    cell: ({ row }: { row: any }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "type",
    header: "类型",
    cell: ({ row }: { row: any }) => {
      const type = row.getValue("type") as string;
      const typeConfig = {
        nextjs: { variant: "success" as const, text: "Next.js" },
        node: { variant: "default" as const, text: "Node.js" },
        python: { variant: "secondary" as const, text: "Python" },
        other: { variant: "outline" as const, text: "其他" },
      };

      const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;

      return (
        <Badge variant={config.variant}>
          {config.text}
        </Badge>
      );
    },
  },
  {
    accessorKey: "pid",
    header: "进程ID",
    cell: ({ row }: { row: any }) => (
      <div className="font-mono text-sm">{row.getValue("pid")}</div>
    ),
  },
  {
    accessorKey: "port",
    header: "端口",
    cell: ({ row }: { row: any }) => (
      <div className="text-muted-foreground">{row.getValue("port") || "-"}</div>
    ),
  },
  {
    accessorKey: "cpu",
    header: "CPU %",
    cell: ({ row }: { row: any }) => (
      <div className="text-muted-foreground">
        {row.getValue("cpu")?.toFixed(1) || "0"}%
      </div>
    ),
  },
  {
    accessorKey: "memory",
    header: "内存 %",
    cell: ({ row }: { row: any }) => (
      <div className="text-muted-foreground">
        {row.getValue("memory")?.toFixed(1) || "0"}%
      </div>
    ),
  },
  {
    accessorKey: "uptime",
    header: "状态",
    cell: ({ row }: { row: any }) => (
      <div className="text-green-600">{row.getValue("uptime")}</div>
    ),
  },
];
