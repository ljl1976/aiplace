"use client";

import { useEffect, useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getServiceColumns } from "./service-columns";
import { ServiceLogsDialog } from "./service-logs-dialog";
import { ServiceConfigDialog } from "./service-config-dialog";
import { toast } from "sonner";
import type { Service } from "../../_lib/types";

export function ServiceTable() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // 对话框状态
  const [selectedService, setSelectedService] = useState<string>("");
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // 定义操作处理函数（必须在useMemo之前）
  const handleRestartClick = (serviceName: string) => {
    setSelectedService(serviceName);
    setShowRestartDialog(true);
  };

  const handleConfirmRestart = async () => {
    setIsRestarting(true);
    try {
      const response = await fetch(
        `/api/service-management/${encodeURIComponent(selectedService)}/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restart' })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("重启成功", { description: result.message });
        setShowRestartDialog(false);
        setTimeout(() => fetchServices(), 2000); // 延迟刷新以让服务重启
      } else {
        toast.error("重启失败", { description: result.error || result.message });
      }
    } catch (error) {
      toast.error("重启失败", { description: "网络错误，请稍后重试" });
    } finally {
      setIsRestarting(false);
    }
  };

  const handleViewLogs = (serviceName: string) => {
    setSelectedService(serviceName);
    setShowLogsDialog(true);
  };

  const handleViewConfig = (serviceName: string) => {
    setSelectedService(serviceName);
    setShowConfigDialog(true);
  };

  async function fetchServices() {
    try {
      const response = await fetch("/api/service-management?type=services");
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  }

  // 创建动态列定义（在操作处理函数之后）
  const serviceColumns = useMemo(
    () => getServiceColumns(
      handleRestartClick,
      handleViewLogs,
      handleViewConfig
    ),
    []
  );

  const table = useReactTable({
    data: services,
    columns: serviceColumns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
    },
  });

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg @2xs/main:text-xl">系统服务</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchServices}
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
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              没有找到应用服务
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
                        colSpan={serviceColumns.length}
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

      {/* 重启确认对话框 */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重启服务</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要重启服务 "{selectedService}" 吗？这可能会导致服务暂时中断。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestart}
              disabled={isRestarting}
            >
              {isRestarting ? "重启中..." : "确认重启"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 日志查看对话框 */}
      <ServiceLogsDialog
        serviceName={selectedService}
        open={showLogsDialog}
        onOpenChange={setShowLogsDialog}
      />

      {/* 配置文件查看对话框 */}
      <ServiceConfigDialog
        serviceName={selectedService}
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
      />
    </>
  );
}
