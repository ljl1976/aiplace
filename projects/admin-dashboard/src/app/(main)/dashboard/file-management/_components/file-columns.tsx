import { FileText, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { FileItem } from "../_lib/types";

export function getFileColumns(onEdit: (file: FileItem) => void): ColumnDef<FileItem>[] {
  return [
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const file = row.original;

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(file)}
            className="h-8 w-8 p-0"
            title="编辑文件"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            <span className="sr-only">编辑</span>
          </Button>
        );
      },
    },
    {
      accessorKey: "name",
      header: "文件名",
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const type = row.original.type;
        const Icon = type === "json" ? FileJson : FileText;
        const file = row.original;

        return (
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
            onClick={() => onEdit(file)}
            title="点击或长按编辑文件"
          >
            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "relativeDir",
      header: "目录",
      cell: ({ row }) => {
        const dir = row.getValue("relativeDir") as string;
        return (
          <div className="text-muted-foreground text-xs truncate" title={dir}>
            {dir === "/" ? "根目录" : dir}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "类型",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        const config = {
          json: { variant: "secondary" as const, text: "JSON" },
          md: { variant: "outline" as const, text: "Markdown" },
        };

        const { variant, text } = config[type as keyof typeof config];

        return (
          <Badge variant={variant}>
            {text}
          </Badge>
        );
      },
    },
    {
      accessorKey: "size",
      header: "大小",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue("size")}</div>
      ),
    },
    {
      accessorKey: "modified",
      header: "修改时间",
      cell: ({ row }) => {
        const date = new Date(row.getValue("modified"));
        return (
          <div className="text-muted-foreground text-xs">
            {date.toLocaleString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        );
      },
    },
  ];
}
