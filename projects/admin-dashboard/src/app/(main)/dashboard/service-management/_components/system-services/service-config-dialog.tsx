"use client";

import { useState, useEffect } from "react";
import { Settings, X } from "lucide-react";
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

interface ServiceConfigDialogProps {
  serviceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceConfigDialog({ serviceName, open, onOpenChange }: ServiceConfigDialogProps) {
  const [config, setConfig] = useState<string>("");
  const [configPath, setConfigPath] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (open && serviceName) {
      fetchConfig();
    }
  }, [open, serviceName]);

  async function fetchConfig() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/service-management/${encodeURIComponent(serviceName)}?type=config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || "没有配置文件数据");
        setConfigPath(data.path || "");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "获取配置文件失败");
        toast.error("获取配置文件失败", { description: errorData.error });
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      toast.error("获取配置文件失败", { description: "网络错误" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            配置文件 - {serviceName}
          </DialogTitle>
          <DialogDescription>
            {configPath && `路径: ${configPath}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConfig}
              disabled={loading}
            >
              {loading ? "加载中..." : "刷新配置"}
            </Button>
          </div>

          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] w-full rounded-md border bg-gray-50 p-4 font-mono text-sm">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                  <p className="mt-2">加载配置中...</p>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words text-gray-800">
                  {config || "没有配置文件数据"}
                </pre>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
