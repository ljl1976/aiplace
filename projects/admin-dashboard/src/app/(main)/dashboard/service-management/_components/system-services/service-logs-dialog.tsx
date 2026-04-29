"use client";

import { useState, useEffect } from "react";
import { FileText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ServiceLogsDialogProps {
  serviceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceLogsDialog({ serviceName, open, onOpenChange }: ServiceLogsDialogProps) {
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (open && serviceName) {
      fetchLogs();
    }
  }, [open, serviceName]);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/service-management/${encodeURIComponent(serviceName)}?type=logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || "没有日志数据");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "获取日志失败");
        toast.error("获取日志失败", { description: errorData.error });
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      toast.error("获取日志失败", { description: "网络错误" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            服务日志 - {serviceName}
          </DialogTitle>
          <DialogDescription>
            显示最近100条日志记录
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
            >
              {loading ? "加载中..." : "刷新日志"}
            </Button>
          </div>

          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] w-full rounded-md border bg-black text-green-400 p-4 font-mono text-sm">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                  <p className="mt-2">加载日志中...</p>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words">
                  {logs || "没有日志数据"}
                </pre>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
