"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, RefreshCw, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Service } from "../../_lib/types";

interface ServiceActionsProps {
  serviceName: string;
  onRestart: (serviceName: string) => void;
  onViewLogs: (serviceName: string) => void;
  onViewConfig: (serviceName: string) => void;
}

function ServiceActions({ serviceName, onRestart, onViewLogs, onViewConfig }: ServiceActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onRestart(serviceName)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          重启服务
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewLogs(serviceName)}>
          <FileText className="mr-2 h-4 w-4" />
          查看日志
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewConfig(serviceName)}>
          <Settings className="mr-2 h-4 w-4" />
          配置文件
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getServiceColumns(
  onRestart: (serviceName: string) => void,
  onViewLogs: (serviceName: string) => void,
  onViewConfig: (serviceName: string) => void
): ColumnDef<Service>[] {
  return [
    {
      accessorKey: "name",
      header: "服务名称",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "state",
      header: "状态",
      cell: ({ row }) => {
        const state = row.getValue("state") as string;
        const statusConfig = {
          running: { variant: "success" as const, text: "运行中" },
          stopped: { variant: "secondary" as const, text: "已停止" },
          failed: { variant: "destructive" as const, text: "失败" },
        };

        const config = statusConfig[state as keyof typeof statusConfig] || statusConfig.stopped;

        return (
          <Badge variant={config.variant}>
            {config.text}
          </Badge>
        );
      },
    },
    {
      accessorKey: "description",
      header: "描述",
      cell: ({ row }) => (
        <div className="max-w-md truncate">{row.getValue("description") || "无描述"}</div>
      ),
    },
    {
      accessorKey: "port",
      header: "端口",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue("port") || "-"}</div>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const service = row.original;
        return (
          <ServiceActions
            serviceName={service.name}
            onRestart={onRestart}
            onViewLogs={onViewLogs}
            onViewConfig={onViewConfig}
          />
        );
      },
    },
  ];
}

// 默认导出，保持向后兼容
export const serviceColumns: ColumnDef<Service>[] = [
  {
    accessorKey: "name",
    header: "服务名称",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "state",
    header: "状态",
    cell: ({ row }) => {
      const state = row.getValue("state") as string;
      const statusConfig = {
        running: { variant: "success" as const, text: "运行中" },
        stopped: { variant: "secondary" as const, text: "已停止" },
        failed: { variant: "destructive" as const, text: "失败" },
      };

      const config = statusConfig[state as keyof typeof statusConfig] || statusConfig.stopped;

      return (
        <Badge variant={config.variant}>
          {config.text}
        </Badge>
      );
    },
  },
  {
    accessorKey: "description",
    header: "描述",
    cell: ({ row }) => (
      <div className="max-w-md truncate">{row.getValue("description") || "无描述"}</div>
    ),
  },
  {
    accessorKey: "port",
    header: "端口",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("port") || "-"}</div>
    ),
  },
  {
    id: "actions",
    header: "操作",
    cell: () => (
      <div className="text-muted-foreground text-sm">需要实现操作</div>
    ),
  },
];
