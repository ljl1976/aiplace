"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { FileItem } from "../_lib/types";

interface FileEditDialogProps {
  file: FileItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileEditDialog({
  file,
  open,
  onOpenChange,
}: FileEditDialogProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 加载文件内容
  useEffect(() => {
    if (file && open) {
      loadFileContent();
    }
  }, [file, open]);

  const loadFileContent = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/file-management/read?path=${encodeURIComponent(file.path)}`
      );

      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
        setHasChanges(false);
      } else {
        const error = await response.json();
        toast.error("加载失败", { description: error.error });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to load file:", error);
      toast.error("加载失败", { description: "网络错误，请稍后重试" });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!file) return;

    setSaving(true);
    try {
      const response = await fetch("/api/file-management/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: file.path,
          content,
        }),
      });

      if (response.ok) {
        toast.success("保存成功", { description: "文件已保存" });
        setHasChanges(false);
        // 刷新页面上的文件列表
        window.dispatchEvent(new Event("file-list-refresh"));
      } else {
        const error = await response.json();
        toast.error("保存失败", { description: error.error });
      }
    } catch (error) {
      console.error("Failed to save file:", error);
      toast.error("保存失败", { description: "网络错误，请稍后重试" });
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg">{file.name}</DialogTitle>
              <Badge variant={file.type === "json" ? "secondary" : "outline"}>
                {file.type.toUpperCase()}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-xs">
            路径: {file.path}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="h-full min-h-[400px] font-mono text-sm resize-none"
                placeholder="文件内容..."
                disabled={saving}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {hasChanges && (
                <span className="text-orange-600">● 有未保存的更改</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || loading || !hasChanges}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
