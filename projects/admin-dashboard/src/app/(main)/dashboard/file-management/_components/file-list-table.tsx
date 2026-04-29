"use client";

import { useEffect, useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { RefreshCw, FileText, FileJson } from "lucide-react";
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
import { toast } from "sonner";
import type { FileItem } from "../_lib/types";
import { getFileColumns } from "./file-columns";

interface FileListTableProps {
  onEditFile: (file: FileItem) => void;
}

export function FileListTable({ onEditFile }: FileListTableProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/file-management");
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      } else {
        const error = await response.json();
        toast.error("加载失败", { description: error.error });
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
      toast.error("加载失败", { description: "网络错误，请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  // 定义操作处理函数（必须在useMemo之前）
  const handleEditClick = (file: FileItem) => {
    onEditFile(file);
  };

  // 创建动态列定义
  const fileColumns = useMemo(
    () => getFileColumns(handleEditClick),
    []
  );

  const table = useReactTable({
    data: files,
    columns: fileColumns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
    },
  });

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg @2xs/main:text-xl">文件列表</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiles}
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
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            没有找到JSON或Markdown文件
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs @2xs/main:text-sm whitespace-nowrap">
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
                        <TableCell key={cell.id} className="text-xs @2xs/main:text-sm whitespace-nowrap">
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
                      colSpan={fileColumns.length}
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
